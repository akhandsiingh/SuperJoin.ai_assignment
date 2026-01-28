'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SyncStatus.css';

function SyncStatus({ apiUrl }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/sync/status`);
      setStatus(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sync status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !status) {
    return <div className="loading">Loading sync status...</div>;
  }

  return (
    <div className="status-container">
      <div className="status-header">
        <h2>Sync System Status</h2>
        <button className="refresh-btn" onClick={fetchStatus}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {status && (
        <div className="status-grid">
          <div className="status-card">
            <div className="status-icon">📊</div>
            <div className="status-info">
              <div className="status-label">Total Users</div>
              <div className="status-value">{status.totalUsers}</div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">⚔️</div>
            <div className="status-info">
              <div className="status-label">Unresolved Conflicts</div>
              <div
                className={`status-value ${
                  status.unresolved_conflicts > 0 ? 'warning' : 'success'
                }`}
              >
                {status.unresolved_conflicts}
              </div>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon">✅</div>
            <div className="status-info">
              <div className="status-label">Processed Webhooks</div>
              <div className="status-value">{status.processed_webhooks}</div>
            </div>
          </div>

          <div className="status-card full-width">
            <div className="status-icon">🕐</div>
            <div className="status-info">
              <div className="status-label">Last Update</div>
              <div className="status-value">
                {new Date(status.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="status-section">
        <h3>System Health</h3>
        <div className="health-items">
          <div className="health-item">
            <span className="health-indicator success">✓</span>
            <span className="health-label">Backend Server</span>
            <span className="health-status">Connected</span>
          </div>
          <div className="health-item">
            <span className="health-indicator success">✓</span>
            <span className="health-label">MySQL Database</span>
            <span className="health-status">Connected</span>
          </div>
          <div className="health-item">
            <span className="health-indicator success">✓</span>
            <span className="health-label">Webhook Receiver</span>
            <span className="health-status">Active</span>
          </div>
          <div className="health-item">
            <span className="health-indicator success">✓</span>
            <span className="health-label">Sync Engine</span>
            <span className="health-status">Running</span>
          </div>
        </div>
      </div>

      <div className="status-section">
        <h3>Integration Instructions</h3>
        <div className="instructions">
          <div className="instruction-step">
            <span className="step-number">1</span>
            <div className="step-content">
              <strong>Google Sheets Setup</strong>
              <p>
                Go to your Google Sheet → Extensions → Apps Script → Paste the
                code from <code>google-apps-script.js</code>
              </p>
            </div>
          </div>

          <div className="instruction-step">
            <span className="step-number">2</span>
            <div className="step-content">
              <strong>Update Webhook URL</strong>
              <p>
                In Apps Script, change <code>WEBHOOK_URL</code> to your backend
                server URL (e.g., {apiUrl}/sheet/webhook)
              </p>
            </div>
          </div>

          <div className="instruction-step">
            <span className="step-number">3</span>
            <div className="step-content">
              <strong>Authorize Script</strong>
              <p>
                Run the script once, then click the Sync menu to test connection
              </p>
            </div>
          </div>

          <div className="instruction-step">
            <span className="step-number">4</span>
            <div className="step-content">
              <strong>Start Syncing</strong>
              <p>
                Edit cells in your Google Sheet and watch updates appear in real-time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SyncStatus;
