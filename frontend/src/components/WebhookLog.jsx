'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WebhookLog.css';

function WebhookLog({ apiUrl }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/sync/changelog`);
      setLogs(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch webhook logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PROCESSED':
        return { color: 'success', label: '✓ Processed' };
      case 'RECEIVED':
        return { color: 'info', label: '📥 Received' };
      case 'ERROR':
        return { color: 'error', label: '❌ Error' };
      default:
        return { color: 'default', label: status };
    }
  };

  if (loading && logs.length === 0) {
    return <div className="loading">Loading webhook logs...</div>;
  }

  return (
    <div className="webhook-container">
      <div className="webhook-header">
        <h2>Webhook Audit Log</h2>
        <button className="refresh-btn" onClick={fetchLogs}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>No webhook events yet. Start editing your Google Sheet!</p>
        </div>
      ) : (
        <div className="logs-list">
          {logs.map((log) => {
            const statusBadge = getStatusBadge(log.status);
            const isExpanded = expandedId === log.id;

            return (
              <div
                key={log.id}
                className={`log-item ${isExpanded ? 'expanded' : ''}`}
              >
                <div
                  className="log-header"
                  onClick={() => toggleExpand(log.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="log-info">
                    <span className="log-id">#{log.id}</span>
                    <span className={`status-badge ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <span className="timestamp">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="expand-toggle">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="log-details">
                    <div className="payload-section">
                      <h4>Payload</h4>
                      <pre className="payload-content">
                        {JSON.stringify(
                          JSON.parse(log.payload),
                          null,
                          2,
                        )}
                      </pre>
                    </div>

                    {log.error_message && (
                      <div className="error-section">
                        <h4>Error</h4>
                        <p>{log.error_message}</p>
                      </div>
                    )}

                    <div className="timestamp-section">
                      <small>
                        Created: {new Date(log.created_at).toLocaleString()}
                      </small>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WebhookLog;
