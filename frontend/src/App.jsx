import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import AdminPanel from "./AdminPanel";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("phish_auth") === "true"
  );
  const [role, setRole] = useState(
    localStorage.getItem("phish_role") || ""
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const API = "http://10.115.31.83:8000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsLoggedIn(true);
        setRole(data.role || "analyst");
        localStorage.setItem("phish_auth", "true");
        localStorage.setItem("phish_role", data.role || "analyst");
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setLoginError("Failed to connect to server");
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole("");
    localStorage.removeItem("phish_auth");
    localStorage.removeItem("phish_role");
    setResult(null);
    setInput("");
    setUsername("");
    setPassword("");
  };

  const analyze = async () => {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: input })
      });

      const data = await res.json();
      setResult(data);
      fetchHistory();

    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const fetchHistory = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(`${API}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchHistory();
    }
  }, [isLoggedIn]);

  const generatePDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = 20;

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
    };

    // Header Background
    doc.setFillColor(11, 15, 25);
    doc.rect(0, 0, pageWidth, 40, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PhishForensics Report", margin, 25);

    // Subtitle / Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 32);

    y = 55;

    // --- Section: Threat Assessment ---
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Threat Assessment", margin, y);
    
    // Draw line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 12;

    // Risk Level Badge
    const riskLevel = result.risk_level.toUpperCase();
    let riskColor = [16, 185, 129]; // success
    if (result.risk_level === "medium") riskColor = [245, 158, 11]; // warning
    if (result.risk_level === "high") riskColor = [239, 68, 68]; // danger

    doc.setFillColor(...riskColor);
    doc.rect(margin, y, 60, 10, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`RISK LEVEL: ${riskLevel}`, margin + 5, y + 7);

    // Risk Percent
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "normal");
    doc.text(`Overall Threat Score: ${result.email_risk_percent}%`, margin + 65, y + 7);
    y += 20;

    // --- Section: Email Metadata ---
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Email Metadata", margin, y);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Sender:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(result.email_analysis?.sender || "Unknown", margin + 25, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Return Path:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(result.email_analysis?.return_path || "Unknown", margin + 25, y);
    y += 15;

    // --- Section: Payload Content ---
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Analyzed Payload", margin, y);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 10;

    doc.setFontSize(9);
    doc.setFont("courier", "normal");
    doc.setTextColor(75, 85, 99); 
    
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(1);
    
    const emailLines = doc.splitTextToSize(input, pageWidth - margin * 2 - 4);
    for (let i = 0; i < emailLines.length; i++) {
        checkPageBreak(10);
        doc.line(margin, y - 3, margin, y + 2);
        doc.text(emailLines[i], margin + 3, y);
        y += 4;
    }
    y += 10;

    // --- Section: URL Forensics ---
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    checkPageBreak(20);
    doc.text("URL Forensics", margin, y);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 10;

    if (!result.risky_urls || result.risky_urls.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("No suspicious URLs detected in the payload.", margin, y);
    } else {
        result.risky_urls.forEach((url, i) => {
            checkPageBreak(30);
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(17, 24, 39);
            const titleStr = `${i + 1}. Target URL:`;
            doc.text(titleStr, margin, y);
            
            doc.setFont("courier", "normal");
            doc.setTextColor(37, 99, 235);
            const urlLines = doc.splitTextToSize(url.original_url, pageWidth - margin - 40);
            doc.text(urlLines, margin + 25, y);
            y += (urlLines.length * 4) + 2;

            const isHigh = url.risk_percent > 70;
            const isMedium = url.risk_percent > 30;
            doc.setFont("helvetica", "bold");
            doc.setTextColor(isHigh ? 239 : isMedium ? 245 : 16, 
                             isHigh ? 68 : isMedium ? 158 : 185, 
                             isHigh ? 68 : isMedium ? 11 : 129);
            doc.text(`Risk Score: ${url.risk_percent}%`, margin + 5, y);
            y += 5;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(75, 85, 99);
            const exp = doc.splitTextToSize(`Finding: ${url.explanation}`, pageWidth - margin * 2 - 10);
            doc.text(exp, margin + 5, y);
            y += exp.length * 5 + 6;
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`PhishForensics - Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    }

    doc.save(`Forensics_Report_${new Date().getTime()}.pdf`);
  };

  if (!isLoggedIn) {
    return (
      <div className="app-wrapper">
        <div className="ambient-glow glow-1"></div>
        <div className="ambient-glow glow-2"></div>
        
        <div className="login-container animate-fade-in">
          <div className="glass-card login-card">
            <div className="logo-container" style={{ marginBottom: "24px" }}>
              <div className="logo-icon">🛡️</div>
              <h1 className="title" style={{ fontSize: "28px" }}>
                Phish<span className="highlight">Forensics</span>
              </h1>
            </div>
            <p className="login-subtitle">System Access Required</p>
            
            <form onSubmit={handleLogin} className="login-form">
              {loginError && <div className="error-message">{loginError}</div>}
              
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="login-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="login-input"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className={`primary-btn ${loginLoading ? 'loading' : ''}`}
                disabled={loginLoading}
                style={{ marginTop: "12px" }}
              >
                {loginLoading ? <span className="spinner"></span> : "Authenticate"}
              </button>
            </form>
            <div className="login-hint">
              <strong>Admin:</strong> admin / admin123<br/>
              <strong>Analyst:</strong> user / user123
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Background ambient effects */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <div className="container animate-fade-in">
        <header className="header">
          <div className="header-top">
            <div className="logo-container">
              <div className="logo-icon">🛡️</div>
              <h1 className="title">
                Phish<span className="highlight">Forensics</span>
              </h1>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
          <p className="subtitle">Advanced Threat Intelligence Sandbox</p>
        </header>

        <main className={`main-content ${role === 'admin' ? 'admin-mode' : ''}`}>
          {role === 'admin' ? (
            <AdminPanel history={history} API={API} fetchHistory={fetchHistory} />
          ) : (
            <>
            <div className="left-column">
            {/* INPUT SECTION */}
            <section className="glass-card input-section">
              <div className="card-header">
                <h2>🎯 Target Payload</h2>
                <span className="status-badge">Sandboxed</span>
              </div>
              <p className="section-desc">Enter the suspicious email content, headers, or raw text below for deep inspection.</p>
              
              <div className="textarea-wrapper">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste email headers, body, or suspicious URLs here..."
                  spellCheck="false"
                />
              </div>

              <button 
                className={`primary-btn ${loading ? 'loading' : ''}`} 
                onClick={analyze}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Analyzing Payload...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">⚡</span>
                    Initiate Scan
                  </>
                )}
              </button>
            </section>

            {/* RESULT SECTION */}
            {result && (
              <div className="results-container animate-fade-in">
                <section className="glass-card threat-card">
                  <div className="card-header">
                    <h2>⚠️ Threat Assessment</h2>
                    <button className="secondary-btn" onClick={generatePDF}>
                      📄 Export PDF
                    </button>
                  </div>
                  
                  <div className="threat-indicator-wrapper">
                    <div className="threat-score-ring">
                       <svg viewBox="0 0 36 36" className={`circular-chart ${result.risk_level}`}>
                        <path className="circle-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path className="circle"
                          strokeDasharray={`${result.email_risk_percent}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="score-text">
                        <span className={`score-value ${result.risk_level}`}>{result.email_risk_percent}%</span>
                      </div>
                    </div>
                    <div className="threat-details">
                      <h3 className={result.risk_level}>{result.risk_level.toUpperCase()} RISK</h3>
                      <p className="threat-summary">Our heuristic engine has classified this payload with a {result.risk_level} severity level.</p>
                    </div>
                  </div>
                </section>

                {result.risky_urls && result.risky_urls.length > 0 && (
                  <section className="glass-card analysis-card">
                    <h2>🔗 URL Forensics</h2>
                    <div className="url-list">
                      {result.risky_urls.map((url, i) => (
                        <div key={i} className="url-block">
                          <div className="url-header">
                            <span className="url-text">{url.original_url}</span>
                            <span className={`risk-badge ${url.risk_percent > 70 ? 'high' : url.risk_percent > 30 ? 'medium' : 'low'}`}>
                              Risk: {url.risk_percent}%
                            </span>
                          </div>
                          
                          <div className="risk-bar">
                            <div
                              className={`risk-fill ${url.risk_percent > 70 ? "high" : url.risk_percent > 30 ? "medium" : "low"}`}
                              style={{ width: `${url.risk_percent}%` }}
                            ></div>
                          </div>
                          
                          <p className="explanation">
                            <span className="explanation-icon">ℹ️</span>
                            {url.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
            </div>

            <div className="right-column">
              {/* HISTORY SECTION */}
              <section className="glass-card history-section">
                <div className="card-header">
                  <h2>🕒 Scan History</h2>
                  <span className="history-count">{history.length} Scans</span>
                </div>
                
                <div className="history-list">
                  {history.length === 0 ? (
                    <div className="empty-state">No scan history available.</div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className={`history-card ${item.risk_level}`}>
                        <div className="history-card-inner">
                          <div className="history-header">
                            <span className="timestamp">{item.timestamp}</span>
                            <span className={`badge ${item.risk_level}`}>
                              {item.risk_level.toUpperCase()}
                            </span>
                          </div>
                          <p className="sender-info" title={item.sender}>
                            {item.sender || "Unknown Sender"}
                          </p>
                          <div className="risk-bar mini">
                            <div
                              className={`risk-fill ${item.risk_level}`}
                              style={{ width: `${item.risk_percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;