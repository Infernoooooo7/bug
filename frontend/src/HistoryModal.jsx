import React from "react";
import "./App.css";

const HistoryModal = ({ data, onClose }) => {
  if (!data) return null;

  // 🚨 CRITICAL FIX: Ensure we use stored values and handle JSON correctly
  let fullAnalysis = {};
  let riskPercent = data.risk_percent;
  let riskLevel = data.risk_level;

  try {
    if (typeof data.full_analysis === 'string') {
      fullAnalysis = JSON.parse(data.full_analysis);
    } else if (data.full_analysis) {
      fullAnalysis = data.full_analysis;
    }
    
    // If fullAnalysis contains the data, prefer it but ensure keys match
    if (fullAnalysis.email_risk_percent !== undefined && !riskPercent) {
      riskPercent = fullAnalysis.email_risk_percent;
    }
    if (fullAnalysis.risk_level && !riskLevel) {
      riskLevel = fullAnalysis.risk_level;
    }
  } catch (e) {
    console.error("Failed to parse full_analysis", e);
  }

  // Final fallbacks
  riskLevel = riskLevel || "low";
  riskPercent = riskPercent !== undefined ? riskPercent : 0;
  
  const urls = fullAnalysis.risky_urls || [];
  const sender = data.sender || "Unknown";
  const returnPath = data.return_path || "Unknown";
  const payload = data.payload || "No payload recorded.";

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <h2>🔎 Investigation Case #{data.id}</h2>
            <span className="timestamp-badge">{data.timestamp}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Executive Risk Summary */}
          <section className="modal-section risk-summary">
            <div className="risk-badge-large">
              <span className={`badge-dot ${riskLevel}`}></span>
              <h3 className={riskLevel}>{riskLevel.toUpperCase()} RISK</h3>
              <span className="score">{riskPercent}% Score</span>
            </div>
            
            <div className="metadata-grid">
              <div className="meta-item">
                <span className="meta-label">Sender:</span>
                <span className="meta-value" title={sender}>{sender}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Return-Path:</span>
                <span className="meta-value" title={returnPath}>{returnPath}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Spoofing Status:</span>
                <span className={`meta-value ${fullAnalysis?.email_analysis?.spoofed ? 'high' : 'low'}`}>
                  {fullAnalysis?.email_analysis?.spoofed ? "⚠️ Detected" : "✅ Clear"}
                </span>
              </div>
            </div>
          </section>

          {/* URL Forensics */}
          <section className="modal-section">
            <h3>🔗 URL Forensics</h3>
            {urls.length === 0 ? (
              <p className="no-data">No malicious URLs detected in this payload.</p>
            ) : (
              <div className="url-table-container">
                <table className="url-table">
                  <thead>
                    <tr>
                      <th>Original URL</th>
                      <th>Expanded Target</th>
                      <th>Risk</th>
                      <th>Finding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((u, i) => (
                      <tr key={i}>
                        <td className="mono">{u.original_url}</td>
                        <td className="mono">{u.expanded_url}</td>
                        <td className={`risk-cell ${u.risk_percent > 70 ? 'high' : u.risk_percent > 30 ? 'medium' : 'low'}`}>
                          {u.risk_percent}%
                        </td>
                        <td>{u.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Raw Payload Block */}
          <section className="modal-section payload-section">
            <h3>📝 Raw Payload Analyzed</h3>
            <div className="raw-payload-viewer">
              <code>{payload}</code>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
