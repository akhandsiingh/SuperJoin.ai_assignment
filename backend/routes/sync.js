import express from 'express';
import { getAllRecords } from '../services/syncEngine.js';
import { executeQuery } from '../config/database.js';

const router = express.Router();

/**
 * GET /sync/users
 * Fetch all records from users table
 */
router.get('/users', async (req, res) => {
  try {
    const users = await getAllRecords('users');
    res.json({
      status: 'success',
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('[SYNC-API] Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
});

/**
 * GET /sync/conflicts
 * Fetch all sync conflicts
 */
router.get('/conflicts', async (req, res) => {
  try {
    const conflicts = await executeQuery(
      `SELECT * FROM sync_conflicts ORDER BY created_at DESC LIMIT 50`,
    );
    res.json({
      status: 'success',
      data: conflicts,
      count: conflicts.length,
    });
  } catch (error) {
    console.error('[SYNC-API] Error fetching conflicts:', error);
    res.status(500).json({
      error: 'Failed to fetch conflicts',
      message: error.message,
    });
  }
});

/**
 * GET /sync/changelog
 * Fetch webhook audit log
 */
router.get('/changelog', async (req, res) => {
  try {
    const log = await executeQuery(
      `SELECT * FROM webhook_audit ORDER BY created_at DESC LIMIT 50`,
    );
    res.json({
      status: 'success',
      data: log,
      count: log.length,
    });
  } catch (error) {
    console.error('[SYNC-API] Error fetching changelog:', error);
    res.status(500).json({
      error: 'Failed to fetch changelog',
      message: error.message,
    });
  }
});

/**
 * GET /sync/status
 * Get overall sync status
 */
router.get('/status', async (req, res) => {
  try {
    const [userCount] = await executeQuery(
      `SELECT COUNT(*) as count FROM users`,
    );
    const [conflictCount] = await executeQuery(
      `SELECT COUNT(*) as count FROM sync_conflicts WHERE resolved_at IS NULL`,
    );
    const [logCount] = await executeQuery(
      `SELECT COUNT(*) as count FROM webhook_audit WHERE status = 'PROCESSED'`,
    );

    res.json({
      status: 'success',
      data: {
        totalUsers: userCount.count,
        unresolved_conflicts: conflictCount.count,
        processed_webhooks: logCount.count,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[SYNC-API] Error fetching status:', error);
    res.status(500).json({
      error: 'Failed to fetch status',
      message: error.message,
    });
  }
});

export default router;
