import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import './App.css';

export default function App() {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://10.115.31.83:8000/docs';
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

      const data = await response.json();

      // 2. Map Backend Response to your UI Components
      setResults({
        score: data.email_risk_percent,
        level: data.risk_level,
        color: data.risk_color,
        analysis: data.email_analysis,
        // Combine safe and risky URLs for the heat-map
        allUrls: [...data.risky_urls, ...data.safe_urls]
      });

    } catch (error) {
      console.error("Backend Error:", error);
      alert("Error: Ensure Person 2's FastAPI server is running on port 8000.");
    } finally {
      setIsScanning(false);
    }
  };

  const downloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 0.5,
      filename: 'Forensic_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000000' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Phish<span className="highlight">Forensics</span> Sandbox</h1>
        <p style={{ color: '#94a3b8', marginTop: '8px' }}>Secure Forensic Analysis API v1.0</p>
      </header>

      <div className="glass-card">
        <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Target Payload</h2>
        <textarea 
          className="textarea"
          placeholder="Paste raw email or message content here..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <button className="btn-scan" onClick={handleScan} disabled={isScanning}>
          {isScanning ? "Processing Heuristics..." : "Analyze Content"}
        </button>
      </div>

      {isScanning && <div className="loading">[System] Expanding URLs... performing similarity checks...</div>}

      {results && !isScanning && (
        <div ref={reportRef} style={{ padding: '10px' }}>
          
          {/* HEADER ANALYSIS CARD */}
          <div className={`glass-card ${results.analysis.spoofed ? 'spoof-alert' : ''}`}>
            <h3 style={{ color: '#e2e8f0', marginTop: 0 }}>Header Analysis</h3>
            <div className="insight-grid">
              <div className="insight-item">
                <span className="insight-label">Reported Sender</span>
                <span style={{ fontFamily: 'monospace' }}>{results.analysis.sender || "Unknown"}</span>
              </div>
              <div className="insight-item">
                <span className="insight-label">Return Path</span>
                <span style={{ fontFamily: 'monospace' }}>{results.analysis.return_path || "None"}</span>
              </div>
            </div>
            {results.analysis.spoofed && (
              <p style={{ color: '#f43f5e', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '10px' }}>
                ⚠️ SENDER SPOOFING DETECTED: Return path domain does not match sender.
              </p>
            )}
          </div>

          <div className="dashboard" style={{ marginTop: '20px' }}>
            <div className="grid-layout">
              <div className="glass-card score-card">
                <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>THREAT LEVEL</h3>
                <div className="score-circle" style={{ color: results.color, borderTopColor: results.color }}>
                  {results.score}
                </div>
                <div className="risk-label" style={{ color: results.color }}>{results.level}</div>
              </div>

              <div className="glass-card">
                <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Forensic Findings</h3>
                <p style={{ lineHeight: '1.6', color: '#cbd5e1', fontSize: '0.95rem' }}>
                   Our analysis identified {results.allUrls.length} total URLs. 
                   The system flagged threats based on visual similarity and header spoofing.
                </p>
                <button className="btn-export" onClick={downloadPDF}>Download Full PDF Report</button>
              </div>
            </div>

            {/* LINK DISTRIBUTION HEAT-MAP */}
            <div className="glass-card" style={{ marginTop: '20px' }}>
              <h3 style={{ color: '#e2e8f0', marginBottom: '20px' }}>Vector Risk Distribution</h3>
              <div className="link-card-grid">
                {results.allUrls.map((item, index) => (
                  <div key={index} className="individual-link-card">
                    <div className="link-info">
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {item.original_url}
                      </span>
                      <div style={{ color: item.risk_percent > 0 ? '#f43f5e' : '#39ff14', fontSize: '0.7rem', marginTop: '4px' }}>
                        {item.explanation}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
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