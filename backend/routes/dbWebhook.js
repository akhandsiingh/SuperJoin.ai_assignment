import express from 'express';
import { processSyncEvent, logWebhookAudit } from '../services/syncEngine.js';

const router = express.Router();

/**
 * POST /db/webhook
 * Receives database changes (from your application or triggers)
 * Used when the DB is modified outside of sync flow
 */
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    console.log('[WEBHOOK-DB] Received:', {
      tableId: payload.tableId,
      rowId: payload.rowId,
      operation: payload.operation,
      changes: payload.changes,
    });

    // Log audit
    await logWebhookAudit(payload, 'RECEIVED');

    // Parse DB event
    const syncEvent = parseDbEvent(payload);

    if (!syncEvent) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Process sync
    const result = await processSyncEvent(syncEvent);

    // Log success
    await logWebhookAudit(payload, 'PROCESSED');

    res.json({
      status: 'success',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WEBHOOK-DB] Error:', error);
    await logWebhookAudit(req.body, 'ERROR', error);

    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message,
    });
  }
});

/**
 * Parse database change event to sync format
 * Expected payload:
 * {
 *   tableId: string,
 *   rowId: number,
 *   operation: 'INSERT' | 'UPDATE' | 'DELETE',
 *   changes: { field: value, ... }
 * }
 */
const parseDbEvent = (payload) => {
  if (!payload.tableId || !payload.rowId || !payload.operation) {
    return null;
  }

  return {
    source: 'DB',
    rowId: payload.rowId,
    tableId: payload.tableId,
    operation: payload.operation,
    timestamp: new Date().toISOString(),
    version: payload.version || 1,
    changes: payload.changes || {},
    metadata: payload.metadata || {},
  };
};

export default router;
