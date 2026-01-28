import express from 'express';
import { processSyncEvent, logWebhookAudit } from '../services/syncEngine.js';

const router = express.Router();

/**
 * POST /sheet/webhook
 * Receives real-time edits from Google Sheets via Apps Script
 */
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    console.log('[WEBHOOK-SHEET] Received:', {
      row: payload.row,
      column: payload.column,
      newValue: payload.newValue,
      oldValue: payload.oldValue,
      sheetName: payload.sheetName,
    });

    // Log audit
    await logWebhookAudit(payload, 'RECEIVED');

    // Parse the sheet event to sync format
    const syncEvent = parseSheetEvent(payload);

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
    console.error('[WEBHOOK-SHEET] Error:', error);
    await logWebhookAudit(req.body, 'ERROR', error);

    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message,
    });
  }
});

/**
 * Parse Google Sheets onEdit event to sync format
 * Expected payload:
 * {
 *   row: number,
 *   column: number,
 *   oldValue: any,
 *   newValue: any,
 *   sheetName: string
 * }
 */
const parseSheetEvent = (payload) => {
  if (!payload.row || !payload.sheetName) {
    return null;
  }

  // Map column numbers to field names (adjust per your schema)
  const columnMap = {
    1: 'id', // Column A
    2: 'name', // Column B
    3: 'email', // Column C
    4: 'salary', // Column D
  };

  const field = columnMap[payload.column];
  if (!field) {
    console.log(
      `[SHEET-EVENT] Ignoring non-tracked column ${payload.column}`,
    );
    return null;
  }

  if (field === 'id') {
    console.log('[SHEET-EVENT] Ignoring ID column edit');
    return null;
  }

  return {
    source: 'SHEET',
    rowId: payload.row,
    tableId: 'users', // Default table, extend for multiple tables
    operation: 'UPDATE',
    timestamp: new Date().toISOString(),
    changes: {
      [field]: payload.newValue,
    },
    metadata: {
      oldValue: payload.oldValue,
      sheetName: payload.sheetName,
    },
  };
};

export default router;
