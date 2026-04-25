import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import './App.css';

export default function App() {
  // Ensure this points to Person 2's FastAPI server (Standard is port 8000)
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
  
  const [emailText, setEmailText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const reportRef = useRef();

  const handleScan = async () => {
    if (!emailText) return;
    setIsScanning(true);
    setResults(null);

    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: emailText })
      });

      if (!response.ok) throw new Error("Server connection failed");

      const data = await response.json();

      // Mapping Backend Response to UI Components
      setResults({
        score: data.email_risk_percent,
        level: data.risk_level,
        color: data.risk_color,
        analysis: data.email_analysis,
        allUrls: [...data.risky_urls, ...data.safe_urls]
      });

    } catch (error) {
      console.error("Backend Error:", error);
      alert("Connection Failed: Ensure the FastAPI server is running with CORS enabled.");
    } finally {
      setIsScanning(false);
    }
  };

  const downloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 0.5,
      filename: `Forensic_Report_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#050505' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Phish<span className="highlight">Forensics</span> Sandbox</h1>
        <p style={{ color: '#94a3b8', marginTop: '8px' }}>Phishing Forensics Lab v1.0.4</p>
      </header>

      <div className="glass-card">
        <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#e2e8f0' }}>Target Payload</h2>
        <textarea 
          className="textarea"
          placeholder="Paste raw email header and content here..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <button className="btn-scan" onClick={handleScan} disabled={isScanning}>
          {isScanning ? "EXECUTING HEURISTICS..." : "ANALYZE VECTORS"}
        </button>
      </div>

      {isScanning && <div className="loading">[SYSTEM] Unmasking URLs... analyzing sender reputation...</div>}

      {results && !isScanning && (
        <div ref={reportRef} className="report-container">
          
          {/* NMAMIT BRANDING HEADER (For PDF and Dashboard) */}
          <div className="forensic-header">
            <h2 className="branding-title">NMAMIT Phishing Forensics Lab</h2>
            <div className="metadata-row">
              <span>CASE_ID: {Math.random().toString(36).toUpperCase().substring(2, 10)}</span>
              <span>TIMESTAMP: {new Date().toLocaleString()}</span>
              <span style={{ color: results.color }}>THREAT_STATUS: {results.level.toUpperCase()}</span>
            </div>
          </div>

          <div className="dashboard">
            {/* HEADER ANALYSIS SECTION */}
            <div className={`glass-card ${results.analysis?.spoofed ? 'spoof-alert' : ''}`}>
              <h3 style={{ color: '#e2e8f0', marginTop: 0 }}>Header Integrity Scan</h3>
              <div className="insight-grid">
                <div className="insight-item">
                  <span className="insight-label">Reported From</span>
                  <span className="mono-text">{results.analysis?.sender || "NOT_FOUND"}</span>
                </div>
                <div className="insight-item">
                  <span className="insight-label">Return-Path</span>
                  <span className="mono-text">{results.analysis?.return_path || "NONE"}</span>
                </div>
              </div>
              {results.analysis?.spoofed && (
                <p className="alert-text">
                  ⚠️ CRITICAL: Domain mismatch detected between Sender and Return-Path.
                </p>
              )}
            </div>

            <div className="grid-layout" style={{ marginTop: '20px' }}>
              {/* MAIN THREAT SCORE */}
              <div className="glass-card score-card">
                <h3 className="card-label">AGGREGATE RISK</h3>
                <div className="score-circle" style={{ color: results.color, borderColor: results.color }}>
                  {results.score}%
                </div>
                <div className="risk-label" style={{ color: results.color }}>{results.level}</div>
              </div>

              {/* FORENSIC SUMMARY */}
              <div className="glass-card">
                <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Forensic Summary</h3>
                <p className="summary-text">
                   The heuristic engine identified {results.allUrls?.length} distinct vectors. 
                   Calculated risk level is based on TLD reputation, character entropy, and sender domain similarity.
                </p>
                <button className="btn-export" onClick={downloadPDF}>Download Forensic Report</button>
              </div>
            </div>

            {/* URL VECTOR HEAT-MAP */}
            <div className="glass-card" style={{ marginTop: '20px' }}>
              <h3 style={{ color: '#e2e8f0', marginBottom: '20px' }}>Vector Risk Distribution</h3>
              <div className="link-card-grid">
                {results.allUrls?.map((item, index) => (
                  <div key={index} className="individual-link-card">
                    <div className="link-info">
                      <span className="url-text">{item.original_url}</span>
                      <div className="explanation-text" style={{ color: item.risk_percent > 0 ? '#f43f5e' : '#39ff14' }}>
                        {item.explanation}
                      </div>
                    </div>
                    <div className="risk-meter">
                      <div className="risk-bar-container">
                        <div className="risk-bar-fill" style={{ 
                          width: `${item.risk_percent}%`, 
                          backgroundColor: item.risk_percent > 70 ? '#f43f5e' : item.risk_percent > 30 ? '#f59e0b' : '#39ff14' 
                        }}></div>
                      </div>
                      <span className="percentage-text" style={{ color: item.risk_percent > 30 ? '#f59e0b' : '#39ff14' }}>
                        {item.risk_percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}