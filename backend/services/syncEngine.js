import { executeQuery, executeUpdate } from '../config/database.js';

const CONFLICT_STRATEGIES = {
  LAST_WRITE_WINS: 'last_write_wins',
  VERSION_BASED: 'version_based',
  MANUAL: 'manual',
};

/**
 * Core sync engine - handles bidirectional sync between Sheet and DB
 */

export const processSyncEvent = async (event) => {
  const { source, rowId, tableId, operation, changes } = event;

  console.log(`[SYNC] Processing ${source} event:`, { rowId, operation, changes });

  // Fetch current DB state
  const currentRecord = await getRecord(tableId, rowId);

  if (!currentRecord) {
    if (operation === 'INSERT') {
      return await insertRecord(tableId, changes);
    }
    return { error: 'Record not found' };
  }

  // Idempotency check - ignore if version is stale
  if (isStaleUpdate(currentRecord, event)) {
    console.log(`[SYNC] Ignoring stale update for row ${rowId}`);
    return { status: 'ignored', reason: 'stale_version' };
  }

  // Loop prevention - check if update originated from same source
  if (shouldIgnoreLoopback(currentRecord, source)) {
    console.log(`[SYNC] Ignoring loopback from ${source}`);
    return { status: 'ignored', reason: 'loopback' };
  }

  // Conflict detection
  const conflict = detectConflict(currentRecord, event);

  if (conflict) {
    console.log(`[SYNC] Conflict detected for row ${rowId}`);
    return await resolveConflict(tableId, currentRecord, event, conflict);
  }

  // No conflict - apply update
  return await applyUpdate(tableId, currentRecord, event);
};

/**
 * Idempotency Check
 */
const isStaleUpdate = (currentRecord, event) => {
  if (!event.version) return false;
  return event.version <= currentRecord.version;
};

/**
 * Loop Prevention - ignore if source matches last updated source
 */
const shouldIgnoreLoopback = (currentRecord, source) => {
  return currentRecord.source === source && currentRecord.source !== 'MANUAL';
};

/**
 * Conflict Detection - check if values differ significantly
 */
const detectConflict = (currentRecord, event) => {
  const changedFields = Object.keys(event.changes);
  const conflicts = [];

  for (const field of changedFields) {
    if (
      currentRecord[field] !== undefined &&
      currentRecord[field] !== event.changes[field]
    ) {
      conflicts.push({
        field,
        currentValue: currentRecord[field],
        incomingValue: event.changes[field],
      });
    }
  }

  return conflicts.length > 0 ? conflicts : null;
};

/**
 * Conflict Resolution - apply strategy
 */
export const resolveConflict = async (
  tableId,
  currentRecord,
  event,
  conflicts,
) => {
  const strategy = CONFLICT_STRATEGIES.LAST_WRITE_WINS;
  const resolvedChanges = {};

  for (const conflict of conflicts) {
    if (strategy === CONFLICT_STRATEGIES.LAST_WRITE_WINS) {
      // Incoming wins if timestamp is newer
      if (
        event.timestamp &&
        new Date(event.timestamp) > new Date(currentRecord.updated_at)
      ) {
        resolvedChanges[conflict.field] = conflict.incomingValue;
      } else {
        resolvedChanges[conflict.field] = conflict.currentValue;
      }
    }
  }

  // Log conflict
  await logConflict(tableId, currentRecord.id, conflicts, resolvedChanges);

  // Apply resolved changes
  return await applyUpdate(
    tableId,
    currentRecord,
    { ...event, changes: resolvedChanges },
  );
};

/**
 * Apply Update to Database
 */
export const applyUpdate = async (tableId, currentRecord, event) => {
  const { source, changes, operation } = event;

  if (operation === 'UPDATE') {
    const updatedRecord = {
      ...currentRecord,
      ...changes,
      source: source,
      version: (currentRecord.version || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const setClauses = Object.keys(changes)
      .map((key) => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(changes), source, updatedRecord.version, currentRecord.id];

    const sql = `
      UPDATE ${tableId}
      SET ${setClauses}, source = ?, version = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const result = await executeUpdate(sql, values);

    console.log(`[SYNC] Applied update to ${tableId} row ${currentRecord.id}`);

    return {
      status: 'success',
      operation: 'UPDATE',
      rowId: currentRecord.id,
      newVersion: updatedRecord.version,
    };
  }

  if (operation === 'DELETE') {
    const sql = `DELETE FROM ${tableId} WHERE id = ?`;
    await executeUpdate(sql, [currentRecord.id]);

    console.log(`[SYNC] Deleted from ${tableId} row ${currentRecord.id}`);

    return {
      status: 'success',
      operation: 'DELETE',
      rowId: currentRecord.id,
    };
  }

  return { error: 'Unknown operation' };
};

/**
 * Insert New Record
 */
const insertRecord = async (tableId, data) => {
  const columns = Object.keys(data).join(', ');
  const placeholders = Object.keys(data)
    .map(() => '?')
    .join(', ');

  const sql = `INSERT INTO ${tableId} (${columns}, source, version) VALUES (${placeholders}, ?, ?)`;
  const values = [...Object.values(data), 'SHEET', 1];

  const result = await executeUpdate(sql, values);

  console.log(`[SYNC] Inserted into ${tableId}`);

  return {
    status: 'success',
    operation: 'INSERT',
    rowId: result.insertId,
    newVersion: 1,
  };
};

/**
 * Get Record by ID
 */
export const getRecord = async (tableId, rowId) => {
  const sql = `SELECT * FROM ${tableId} WHERE id = ? LIMIT 1`;
  const results = await executeQuery(sql, [rowId]);
  return results[0] || null;
};

/**
 * Get All Records (for UI)
 */
export const getAllRecords = async (tableId) => {
  const sql = `SELECT * FROM ${tableId} ORDER BY id ASC`;
  return await executeQuery(sql);
};

/**
 * Log Conflict for Audit Trail
 */
const logConflict = async (
  tableId,
  rowId,
  conflicts,
  resolvedChanges,
) => {
  const sql = `
    INSERT INTO sync_conflicts
    (table_name, row_id, sheet_value, db_value, resolved_value, resolution_strategy, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  for (const conflict of conflicts) {
    await executeUpdate(sql, [
      tableId,
      rowId,
      JSON.stringify(conflict.incomingValue),
      JSON.stringify(conflict.currentValue),
      JSON.stringify(resolvedChanges[conflict.field]),
      CONFLICT_STRATEGIES.LAST_WRITE_WINS,
    ]);
  }
};

/**
 * Log Webhook for Audit
 */
export const logWebhookAudit = async (payload, status, error = null) => {
  const sql = `
    INSERT INTO webhook_audit (payload, status, error_message)
    VALUES (?, ?, ?)
  `;

  await executeUpdate(sql, [
    JSON.stringify(payload),
    status,
    error ? error.message : null,
  ]);
};
