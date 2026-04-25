import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import './App.css';

export default function App() {
  // CONFIGURATION: Replace '127.0.0.1' with your friend's laptop IP (e.g., '192.168.1.5')
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

      setResults({
        score: data.email_risk_percent,
        level: data.risk_level,
        color: data.risk_color,
        analysis: data.email_analysis,
        allUrls: [...data.risky_urls, ...data.safe_urls]
      });
    } catch (error) {
      console.error("Backend Connection Failed:", error);
      alert(`Error: Ensure the server at ${BACKEND_URL} is running and CORS is enabled.`);
    } finally {
      setIsScanning(false);
    }
  };

  const downloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 0.3,
      filename: `NMAMIT_Forensic_Report_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#050505', 
        scrollY: 0, // CRITICAL: Fixes cut-off issues
        windowWidth: element.scrollWidth // Ensures full width is captured
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Phish<span style={{ color: '#39ff14' }}>Forensics</span> Sandbox</h1>
        <p style={{ color: '#94a3b8' }}>NMAMIT Forensic Terminal v1.0.4</p>
      </header>

      <div className="glass-card">
        <h2 style={{ marginTop: 0, color: '#f8fafc' }}>Target Payload</h2>
        <textarea 
          className="textarea"
          style={{ width: '100%', height: '180px', background: '#000', border: '1px dashed #333', color: '#39ff14', padding: '15px', borderRadius: '8px', marginBottom: '15px', outline: 'none', fontFamily: 'monospace' }}
          placeholder="Paste raw email content for forensic unmasking..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <button onClick={handleScan} style={{ width: '100%', padding: '14px', background: '#39ff14', color: '#000', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer', letterSpacing: '1px' }}>
          {isScanning ? "EXECUTING HEURISTICS..." : "ANALYZE VECTORS"}
        </button>
      </div>

      {isScanning && <div className="loading">[SYSTEM] Unmasking URLs... running similarity checks...</div>}

      {results && !isScanning && (
        <div ref={reportRef} style={{ padding: '25px', background: '#050505', borderRadius: '12px' }}>
          {/* BRANDED HEADER */}
          <div className="forensic-header">
            <h2 className="branding-title">NMAMIT Phishing Forensics Lab</h2>
            <div className="metadata-row">
              <span>CASE_ID: {Math.random().toString(36).toUpperCase().substring(2, 10)}</span>
              <span>TIMESTAMP: {new Date().toLocaleString()}</span>
              <span style={{ color: results.color, fontWeight: 'bold' }}>STATUS: {results.level.toUpperCase()} RISK</span>
            </div>
          </div>

          <div className="dashboard">
            {/* HEADER ANALYSIS */}
            <div className={`glass-card ${results.analysis?.spoofed ? 'spoof-alert' : ''}`}>
              <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Header Integrity Scan</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                  <span className="insight-label">Reported Sender</span>
                  <div className="mono-text" style={{ fontSize: '0.9rem' }}>{results.analysis?.sender}</div>
                </div>
                <div style={{ background: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                  <span className="insight-label">Return-Path</span>
                  <div className="mono-text" style={{ fontSize: '0.9rem' }}>{results.analysis?.return_path}</div>
                </div>
              </div>
              {results.analysis?.spoofed && (
                <div className="alert-text" style={{ color: '#f43f5e', marginTop: '12px', fontWeight: 'bold' }}>
                   ⚠️ CRITICAL: Domain mismatch detected between Sender and Return-Path.
                </div>
              )}
            </div>

            {/* VECTOR DISTRIBUTION */}
            <div className="glass-card" style={{ marginTop: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#e2e8f0', marginBottom: '20px' }}>Vector Risk Distribution</h3>
              {results.allUrls.map((url, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #222', alignItems: 'center' }}>
                  <div style={{ flex: 1, paddingRight: '20px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontFamily: 'monospace', wordBreak: 'break-all' }}>{url.original_url}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{url.explanation}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: '220px' }}>
                    <div className="risk-bar-container" style={{ width: '150px', height: '8px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden', marginRight: '15px' }}>
                      <div style={{ width: `${url.risk_percent}%`, height: '100%', background: url.risk_percent > 70 ? '#f43f5e' : url.risk_percent > 30 ? '#f59e0b' : '#39ff14', transition: 'width 1s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', width: '40px', textAlign: 'right', fontFamily: 'monospace' }}>{url.risk_percent}%</span>
                  </div>
                </div>
              ))}
              <button className="btn-export" onClick={downloadPDF} style={{ marginTop: '25px', background: 'transparent', color: '#39ff14', border: '1px solid #39ff14', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s' }}>
                EXPORT FORENSIC PDF REPORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}