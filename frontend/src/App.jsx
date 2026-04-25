import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import './App.css';

export default function App() {
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
      alert("Error: Ensure the FastAPI server is running on port 8000.");
    } finally {
      setIsScanning(false);
    }
  };

  const downloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 0.3,
      filename: `Forensic_Report_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#050505', // Forces dark PDF background
        logging: false 
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Phish<span style={{ color: '#39ff14' }}>Forensics</span> Sandbox</h1>
        <p style={{ color: '#94a3b8' }}>Secure Analysis Terminal v1.0.4</p>
      </header>

      <div className="glass-card">
        <h2 style={{ marginTop: 0, color: '#f8fafc' }}>Target Payload</h2>
        <textarea 
          className="textarea"
          style={{ width: '100%', height: '180px', background: '#000', border: '1px dashed #333', color: '#39ff14', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}
          placeholder="Paste raw email content for forensic unmasking..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <button onClick={handleScan} style={{ width: '100%', padding: '12px', background: '#39ff14', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {isScanning ? "EXECUTING HEURISTICS..." : "ANALYZE VECTORS"}
        </button>
      </div>

      {results && (
        <div ref={reportRef} style={{ padding: '20px', background: '#050505' }}>
          {/* BRANDED HEADER FOR PDF */}
          <div className="forensic-header">
            <h2 className="branding-title">NMAMIT Phishing Forensics Lab</h2>
            <div className="metadata-row">
              <span>CASE_ID: {Math.random().toString(36).toUpperCase().substring(2, 10)}</span>
              <span>TIMESTAMP: {new Date().toLocaleString()}</span>
              <span style={{ color: results.color }}>STATUS: {results.level.toUpperCase()} RISK</span>
            </div>
          </div>

          {/* SENDER ANALYSIS */}
          <div className={`glass-card ${results.analysis?.spoofed ? 'spoof-alert' : ''}`}>
            <h3 style={{ marginTop: 0 }}>Header Integrity Scan</h3>
            <div className="insight-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="insight-item" style={{ background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>REPORTED SENDER</span>
                <div className="mono-text">{results.analysis?.sender}</div>
              </div>
              <div className="insight-item" style={{ background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>RETURN-PATH</span>
                <div className="mono-text">{results.analysis?.return_path}</div>
              </div>
            </div>
            {results.analysis?.spoofed && <div className="alert-text">⚠️ CRITICAL: Domain mismatch detected in headers.</div>}
          </div>

          {/* VECTOR DISTRIBUTION */}
          <div className="glass-card">
            <h3 style={{ marginTop: 0 }}>Vector Risk Distribution</h3>
            {results.allUrls.map((url, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{url.original_url}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{url.explanation}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="risk-bar-container">
                    <div className="risk-bar-fill" style={{ width: `${url.risk_percent}%`, background: url.risk_percent > 50 ? '#f43f5e' : '#39ff14' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{url.risk_percent}%</span>
                </div>
              </div>
            ))}
            <button className="btn-export" onClick={downloadPDF} style={{ marginTop: '20px', background: 'transparent', color: '#39ff14', border: '1px solid #39ff14', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              Export Forensic PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}import { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import './App.css';

export default function App() {
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
      alert("Error: Ensure the FastAPI server is running on port 8000.");
    } finally {
      setIsScanning(false);
    }
  };

  const downloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 0.3,
      filename: `Forensic_Report_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#050505', // Forces dark PDF background
        logging: false 
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Phish<span style={{ color: '#39ff14' }}>Forensics</span> Sandbox</h1>
        <p style={{ color: '#94a3b8' }}>Secure Analysis Terminal v1.0.4</p>
      </header>

      <div className="glass-card">
        <h2 style={{ marginTop: 0, color: '#f8fafc' }}>Target Payload</h2>
        <textarea 
          className="textarea"
          style={{ width: '100%', height: '180px', background: '#000', border: '1px dashed #333', color: '#39ff14', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}
          placeholder="Paste raw email content for forensic unmasking..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
        />
        <button onClick={handleScan} style={{ width: '100%', padding: '12px', background: '#39ff14', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          {isScanning ? "EXECUTING HEURISTICS..." : "ANALYZE VECTORS"}
        </button>
      </div>

      {results && (
        <div ref={reportRef} style={{ padding: '20px', background: '#050505' }}>
          {/* BRANDED HEADER FOR PDF */}
          <div className="forensic-header">
            <h2 className="branding-title">NMAMIT Phishing Forensics Lab</h2>
            <div className="metadata-row">
              <span>CASE_ID: {Math.random().toString(36).toUpperCase().substring(2, 10)}</span>
              <span>TIMESTAMP: {new Date().toLocaleString()}</span>
              <span style={{ color: results.color }}>STATUS: {results.level.toUpperCase()} RISK</span>
            </div>
          </div>

          {/* SENDER ANALYSIS */}
          <div className={`glass-card ${results.analysis?.spoofed ? 'spoof-alert' : ''}`}>
            <h3 style={{ marginTop: 0 }}>Header Integrity Scan</h3>
            <div className="insight-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="insight-item" style={{ background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>REPORTED SENDER</span>
                <div className="mono-text">{results.analysis?.sender}</div>
              </div>
              <div className="insight-item" style={{ background: '#111', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>RETURN-PATH</span>
                <div className="mono-text">{results.analysis?.return_path}</div>
              </div>
            </div>
            {results.analysis?.spoofed && <div className="alert-text">⚠️ CRITICAL: Domain mismatch detected in headers.</div>}
          </div>

          {/* VECTOR DISTRIBUTION */}
          <div className="glass-card">
            <h3 style={{ marginTop: 0 }}>Vector Risk Distribution</h3>
            {results.allUrls.map((url, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{url.original_url}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{url.explanation}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="risk-bar-container">
                    <div className="risk-bar-fill" style={{ width: `${url.risk_percent}%`, background: url.risk_percent > 50 ? '#f43f5e' : '#39ff14' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{url.risk_percent}%</span>
                </div>
              </div>
            ))}
            <button className="btn-export" onClick={downloadPDF} style={{ marginTop: '20px', background: 'transparent', color: '#39ff14', border: '1px solid #39ff14', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              Export Forensic PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}