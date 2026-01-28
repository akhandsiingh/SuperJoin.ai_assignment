'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DataTable.css';

function DataTable({ apiUrl }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/sync/users`);
      setUsers(response.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditValues({ ...user });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleChange = (field, value) => {
    setEditValues({ ...editValues, [field]: value });
  };

  const handleSave = async () => {
    try {
      // Send update to DB webhook
      const changes = {};
      const originalUser = users.find((u) => u.id === editingId);

      for (const key in editValues) {
        if (editValues[key] !== originalUser[key] && ['name', 'email', 'salary'].includes(key)) {
          changes[key] = editValues[key];
        }
      }

      if (Object.keys(changes).length === 0) {
        handleCancel();
        return;
      }

      await axios.post(`${apiUrl}/db/webhook`, {
        tableId: 'users',
        rowId: editingId,
        operation: 'UPDATE',
        changes,
      });

      handleCancel();
      fetchUsers();
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    }
  };

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>Users Database</h2>
        <button className="refresh-btn" onClick={fetchUsers}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {users.length === 0 ? (
        <div className="empty-state">
          <p>No users found. Add some data to your Google Sheet!</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Salary</th>
                <th>Version</th>
                <th>Last Updated</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={editingId === user.id ? 'editing' : ''}>
                  <td>{user.id}</td>
                  <td>
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={editValues.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td>
                    {editingId === user.id ? (
                      <input
                        type="email"
                        value={editValues.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td>
                    {editingId === user.id ? (
                      <input
                        type="number"
                        value={editValues.salary || ''}
                        onChange={(e) => handleChange('salary', parseFloat(e.target.value))}
                      />
                    ) : (
                      `$${parseFloat(user.salary).toLocaleString()}`
                    )}
                  </td>
                  <td className="version-badge">{user.version || 1}</td>
                  <td className="date">
                    {new Date(user.updated_at).toLocaleTimeString()}
                  </td>
                  <td>
                    <span className={`source-badge ${user.source?.toLowerCase()}`}>
                      {user.source || 'DB'}
                    </span>
                  </td>
                  <td className="actions">
                    {editingId === user.id ? (
                      <>
                        <button className="save-btn" onClick={handleSave}>
                          ✓ Save
                        </button>
                        <button className="cancel-btn" onClick={handleCancel}>
                          ✕ Cancel
                        </button>
                      </>
                    ) : (
                      <button className="edit-btn" onClick={() => handleEdit(user)}>
                        ✏️ Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DataTable;
