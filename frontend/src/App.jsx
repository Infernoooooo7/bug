import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminPanel from "./AdminPanel";
import { AdminDashboard } from "./AdminDashboard";
import { DashboardPage, ScanPage, HistoryPage, UsersPage, ThreatIntelPage, SettingsPage } from "./pages";
import HistoryModal from "./HistoryModal";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

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

  const API = "http://localhost:8000";

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

  const generatePDF = async () => {
    if (!result) return;
    try {
      const res = await fetch(`${API}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Forensics_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF report.");
    }
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
            <p className="login-subtitle">Enter your credentials to continue</p>
            
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
          </div>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminPanel handleLogout={handleLogout} />}>
            <Route index element={<Navigate to="/admin" replace />} />
            <Route path="dashboard" element={<DashboardPage history={history} API={API} fetchHistory={fetchHistory} />} />
            <Route path="scan" element={<ScanPage API={API} fetchHistory={fetchHistory} />} />
            <Route path="history" element={<HistoryPage history={history} API={API} fetchHistory={fetchHistory} />} />
            <Route path="admin" element={<AdminDashboard history={history} API={API} fetchHistory={fetchHistory} />} />
            <Route path="users" element={<UsersPage API={API} />} />
            <Route path="threat-intel" element={<ThreatIntelPage history={history} API={API} />} />
            <Route path="settings" element={<SettingsPage API={API} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
    <div className="app-wrapper">
      {/* Background ambient effects */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <div className="container animate-fade-in">
        <header className="header">
          <div className="header-top">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
          
          <div className="logo-container">
            <div className="logo-icon">🛡️</div>
            <h1 className="title">
              Phish<span className="highlight">Forensics</span>
            </h1>
          </div>
          <p className="subtitle">Advanced Threat Intelligence Sandbox</p>
        </header>

        <main className="main-content">
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
                        <div 
                          key={i} 
                          className="url-block staggered-item"
                          style={{ animationDelay: `${0.2 + (i * 0.1)}s` }}
                        >
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
                      history.map((item, index) => {
                        let displayUrl = "Deep Forensic Scan";
                        try {
                          const analysis = typeof item.full_analysis === 'string' ? JSON.parse(item.full_analysis) : item.full_analysis;
                          if (analysis?.risky_urls?.length > 0) displayUrl = analysis.risky_urls[0].original_url;
                          else if (analysis?.safe_urls?.length > 0) displayUrl = analysis.safe_urls[0].original_url;
                        } catch (e) {
                          console.warn("Analysis parse failed", e);
                        }
                      
                      return (
                      <div 
                        key={item.id} 
                        className={`history-card staggered-item ${item.risk_level}`}
                        style={{ animationDelay: `${0.1 + (index * 0.05)}s`, cursor: 'pointer' }}
                        onClick={() => setSelectedHistoryItem(item)}
                      >
                        <div className="history-card-inner">
                          <div className="history-header">
                            <span className="timestamp">{item.timestamp}</span>
                            <span className={`badge ${item.risk_level}`}>
                              {item.risk_level.toUpperCase()}
                            </span>
                          </div>
                          
                          {item.sender && item.sender.trim() !== "None" && item.sender.trim() !== "" && (
                            <p className="sender-info" title={item.sender}>
                              {item.sender}
                            </p>
                          )}
                          
                          <p className="url-preview" title={displayUrl} style={{ 
                            margin: (!item.sender || item.sender.trim() === "None" || item.sender.trim() === "") ? "12px 0" : "4px 0 12px", 
                            fontSize: (!item.sender || item.sender.trim() === "None" || item.sender.trim() === "") ? "15px" : "13px", 
                            color: "var(--accent)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "monospace" 
                          }}>
                            🔗 {displayUrl}
                          </p>
                          
                          <div className="risk-bar mini">
                            <div
                              className={`risk-fill ${item.risk_level}`}
                              style={{ width: `${item.risk_percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              </section>
            </div>
            </>
        </main>
      </div>

      {selectedHistoryItem && (
        <HistoryModal data={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />
      )}
    </div>
    </BrowserRouter>
  );
}

export default App;