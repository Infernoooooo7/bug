import React, { useState, useEffect } from "react";
import HistoryModal from "./HistoryModal";

export const AdminDashboard = ({ history, API, fetchHistory }) => {
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [statsData, setStatsData] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      await fetch(`${API}/delete-log/${id}`, { method: "DELETE" });
      fetchHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/stats`);
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [history]);

  const handleExport = () => {
    window.location.href = `${API}/export`;
  };

  const totalScans = statsData?.total_scans || history.length || 0;
  const metrics = {
    high: statsData?.high_risk || 0,
    medium: statsData?.medium_risk || 0,
    low: statsData?.low_risk || 0,
  };

  const threatHits = statsData?.threat_hits || 0;
  const users = statsData?.users || 28;

  const threatColors = ["var(--admin-danger)", "var(--admin-warning)", "var(--admin-success)", "var(--admin-muted)", "var(--admin-primary)"];
  
  const topThreats = statsData?.top_threats?.map((t, idx) => ({
    name: t.name,
    count: t.count,
    color: threatColors[idx % threatColors.length]
  })) || [];

  const getDonutSegments = () => {
    if (totalScans === 0) return null;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    
    const highPct = metrics.high / totalScans;
    const medPct = metrics.medium / totalScans;
    const lowPct = metrics.low / totalScans;

    const highDash = highPct * circumference;
    const medDash = medPct * circumference;
    const lowDash = lowPct * circumference;

    return (
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="15" />
        
        {/* High Risk (Red) */}
        <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#ef4444" strokeWidth="15" 
          strokeDasharray={`${highDash} ${circumference}`} strokeDashoffset="0" />
        
        {/* Medium Risk (Yellow) */}
        <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f59e0b" strokeWidth="15" 
          strokeDasharray={`${medDash} ${circumference}`} strokeDashoffset={`-${highDash}`} />
        
        {/* Low Risk (Green) */}
        <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#10b981" strokeWidth="15" 
          strokeDasharray={`${lowDash} ${circumference}`} strokeDashoffset={`-${highDash + medDash}`} />
      </svg>
    );
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <div className="title-icon">🛡️</div>
          <div>
            <h2>Admin Control Panel</h2>
            <p>Monitor and manage system scans, users and threat intelligence</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div className="date-picker-btn">📅 Apr 20 - Apr 26, 2026</div>
          <button className="generate-btn" style={{ margin: 0 }} onClick={handleExport}>⬇️ Export Logs</button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="stats-grid">
        <div className="stat-card animate-fade-in">
          <div className="stat-icon blue">📈</div>
          <div className="stat-info">
            <div className="stat-label">Total Scans</div>
            <div className="stat-value">{totalScans.toLocaleString()}</div>
            <div className="stat-trend up">↑ 18.6% <span>from last week</span></div>
          </div>
        </div>
        
        <div className="stat-card animate-fade-in">
          <div className="stat-icon red">🛡️</div>
          <div className="stat-info">
            <div className="stat-label">High Risk Detected</div>
            <div className="stat-value">{metrics.high.toLocaleString()}</div>
            <div className="stat-trend up">↑ 24.3% <span>from last week</span></div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="stat-icon purple">👥</div>
          <div className="stat-info">
            <div className="stat-label">Users</div>
            <div className="stat-value">{users}</div>
            <div className="stat-trend up">↑ 12.5% <span>from last week</span></div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="stat-icon green">🎯</div>
          <div className="stat-info">
            <div className="stat-label">Threat Intelligence Hits</div>
            <div className="stat-value">{threatHits.toLocaleString()}</div>
            <div className="stat-trend up">↑ 31.2% <span>from last week</span></div>
          </div>
        </div>
      </div>

      {/* GRID CONTENT */}
      <div className="dashboard-grid">
        
        {/* LEFT: TABLE */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">📋 Recent Scan Logs</div>
            <div className="log-count-badge">{history.length} Logs Found</div>
          </div>
          
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Sender</th>
                  <th>Risk Level</th>
                  <th>Risk %</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>No scan history available.</td></tr>
                ) : (
                  history.slice(0, 10).map(log => {
                    let displayUrl = "No URL detected";
                    try {
                      const analysis = JSON.parse(log.full_analysis);
                      if (analysis?.risky_urls?.length > 0) displayUrl = analysis.risky_urls[0].original_url;
                      else if (analysis?.safe_urls?.length > 0) displayUrl = analysis.safe_urls[0].original_url;
                    } catch (e) {}

                    return (
                      <tr key={log.id} className="animate-fade-in">
                        <td>{log.timestamp.replace(" ", "\n")}</td>
                        <td>
                          <div className="sender-col">
                            <span className="sender-name">
                              {log.sender && log.sender.trim() !== "None" && log.sender.trim() !== "" ? log.sender : "Raw URL Scan"}
                            </span>
                            <span className="sender-url" title={displayUrl}>🔗 {displayUrl}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-badge ${log.risk_level}`}>
                            {log.risk_level.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="risk-bar-container">
                            <span>{log.risk_percent}%</span>
                            <div className="risk-bar-bg">
                              <div className={`risk-bar-fill ${log.risk_level}`} style={{ width: `${log.risk_percent}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="status-indicator">
                            <div className="status-dot"></div>
                            Completed
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="icon-btn inspect" onClick={() => setSelectedHistoryItem(log)} title="Inspect">👁</button>
                            <a href={`${API}/report/${log.id}`} className="icon-btn" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--admin-accent)', textDecoration: 'none' }} title="Export PDF">📄</a>
                            <button className="icon-btn delete" onClick={() => handleDelete(log.id)} title="Delete">🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Mock */}
          {history.length > 0 && (
            <div className="pagination">
              <button className="page-btn">{'<'}</button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">...</button>
              <button className="page-btn">5</button>
              <button className="page-btn">{'>'}</button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* DONUT CHART */}
          <div className="glass-panel">
            <div className="panel-title">🎯 Risk Distribution</div>
            
            <div className="donut-container">
              {getDonutSegments()}
              <div className="donut-inner-text">
                <h3>{totalScans.toLocaleString()}</h3>
                <p>Total Scans</p>
              </div>
            </div>

            <div className="legend-list">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#ef4444", boxShadow: "0 0 8px #ef4444" }}></div>
                <div className="legend-label">High Risk</div>
                <div className="legend-val">{((metrics.high / (totalScans||1))*100).toFixed(1)}% ({metrics.high})</div>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }}></div>
                <div className="legend-label">Medium Risk</div>
                <div className="legend-val">{((metrics.medium / (totalScans||1))*100).toFixed(1)}% ({metrics.medium})</div>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }}></div>
                <div className="legend-label">Low Risk</div>
                <div className="legend-val">{((metrics.low / (totalScans||1))*100).toFixed(1)}% ({metrics.low})</div>
              </div>
            </div>
          </div>

          {/* TOP THREATS */}
          <div className="glass-panel" style={{ flex: 1 }}>
            <div className="panel-title">⚙️ Top Threats Detected</div>
            
            <div className="threat-list">
              {topThreats.map((threat, idx) => (
                <div className="threat-item" key={idx}>
                  <div className="threat-rank" style={{ background: `rgba(${threat.color === 'var(--admin-danger)' ? '239,68,68' : threat.color === 'var(--admin-warning)' ? '245,158,11' : '139,92,246'}, 0.2)`, color: threat.color }}>
                    {idx + 1}
                  </div>
                  <div className="threat-name">{threat.name}</div>
                  <div className="threat-count" style={{ color: threat.color }}>{threat.count}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {selectedHistoryItem && (
        <HistoryModal data={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      )}
    </>
  );
};
