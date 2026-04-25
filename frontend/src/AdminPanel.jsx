import React, { useState } from "react";
import "./App.css"; // Ensure styles apply

const AdminPanel = ({ history, API, fetchHistory }) => {
  const [editingLog, setEditingLog] = useState(null);
  const [editRiskLevel, setEditRiskLevel] = useState("");
  const [editRiskPercent, setEditRiskPercent] = useState("");

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await fetch(`${API}/delete-log/${id}`, { method: "DELETE" });
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (log) => {
    setEditingLog(log);
    setEditRiskLevel(log.risk_level);
    setEditRiskPercent(log.risk_percent);
  };

  const saveEdit = async () => {
    try {
      await fetch(`${API}/update-log/${editingLog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_level: editRiskLevel,
          risk_percent: parseInt(editRiskPercent)
        })
      });
      setEditingLog(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-panel glass-card animate-fade-in" style={{ width: "100%" }}>
      <div className="card-header">
        <h2>🛡️ Admin Control Panel</h2>
        <span className="status-badge">{history.length} Logs Found</span>
      </div>
      
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Sender</th>
              <th>Risk Level</th>
              <th>Risk %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan="5" className="empty-state">No scan history available.</td></tr>
            ) : (
              history.map(log => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td title={log.sender} className="table-sender">{log.sender || "Unknown"}</td>
                  <td>
                    <span className={`badge ${log.risk_level}`}>
                      {log.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="risk-bar mini" style={{ width: "60px", display: "inline-block", marginRight: "8px" }}>
                       <div className={`risk-fill ${log.risk_level}`} style={{ width: `${log.risk_percent}%` }}></div>
                    </div>
                    {log.risk_percent}%
                  </td>
                  <td className="actions-cell">
                    <button className="edit-btn secondary-btn" onClick={() => openEdit(log)}>✏️ Edit</button>
                    <button className="delete-btn secondary-btn" onClick={() => handleDelete(log.id)}>🗑️ Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingLog && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-card modal-content">
            <h2>Edit Log #{editingLog.id}</h2>
            
            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Risk Level</label>
              <select 
                value={editRiskLevel} 
                onChange={e => setEditRiskLevel(e.target.value)} 
                className="login-input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Risk Percent (0-100)</label>
              <input 
                type="number" 
                value={editRiskPercent} 
                onChange={e => setEditRiskPercent(e.target.value)} 
                className="login-input" 
                min="0" max="100" 
              />
            </div>
            
            <div className="modal-actions" style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button className="primary-btn" onClick={saveEdit}>💾 Save Changes</button>
              <button className="secondary-btn" onClick={() => setEditingLog(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
