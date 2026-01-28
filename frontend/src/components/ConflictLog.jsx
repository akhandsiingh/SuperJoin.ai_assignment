'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ConflictLog.css';

function ConflictLog({ apiUrl }) {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConflicts();
    const interval = setInterval(fetchConflicts, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/sync/conflicts`);
      setConflicts(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch conflicts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && conflicts.length === 0) {
    return <div className="loading">Loading conflicts...</div>;
  }

  return (
    <div className="conflict-container">
      <div className="conflict-header">
        <h2>Sync Conflicts Log</h2>
        <button className="refresh-btn" onClick={fetchConflicts}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {conflicts.length === 0 ? (
        <div className="empty-state">
          <p>✅ No conflicts detected! System is in sync.</p>
        </div>
      ) : (
        <div className="conflicts-list">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="conflict-item">
              <div className="conflict-header-info">
                <span className="conflict-id">Conflict #{conflict.id}</span>
                <span className="table-name">{conflict.table_name}</span>
                <span className="row-id">Row {conflict.row_id}</span>
                <span className="timestamp">
                  {new Date(conflict.created_at).toLocaleString()}
                </span>
              </div>

              <div className="conflict-details">
                <div className="conflict-row">
                  <div className="conflict-column">
                    <strong>Sheet Value:</strong>
                    <code>{conflict.sheet_value}</code>
                  </div>
                  <div className="conflict-column">
                    <strong>DB Value:</strong>
                    <code>{conflict.db_value}</code>
                  </div>
                </div>

                <div className="conflict-row">
                  <div className="conflict-column">
                    <strong>Resolved Value:</strong>
                    <code>{conflict.resolved_value}</code>
                  </div>
                  <div className="conflict-column">
                    <strong>Strategy:</strong>
                    <span className="strategy-badge">
                      {conflict.resolution_strategy}
                    </span>
                  </div>
                </div>
              </div>

              {conflict.resolved_at && (
                <div className="conflict-resolved">
                  Resolved at{' '}
                  {new Date(conflict.resolved_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConflictLog;
