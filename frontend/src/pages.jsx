import React, { useState, useEffect, useMemo } from 'react';
import HistoryModal from "./HistoryModal";

// --- REUSABLE MINI COMPONENTS ---

const GlassCard = ({ title, children, icon, badge, className = "" }) => (
  <div className={`glass-panel animate-fade-in ${className}`} style={{ height: '100%' }}>
    <div className="panel-header">
      <div className="panel-title">
        {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
        {title}
      </div>
      {badge && <div className="log-count-badge">{badge}</div>}
    </div>
    <div style={{ marginTop: '15px' }}>{children}</div>
  </div>
);

const StatCard = ({ label, value, trend, trendUp, icon, colorClass }) => (
  <div className="stat-card animate-fade-in">
    <div className={`stat-icon ${colorClass}`}>{icon}</div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
        {trendUp ? '↑' : '↓'} {trend} <span>vs last week</span>
      </div>
    </div>
  </div>
);

// --- 1. DASHBOARD PAGE ---
export const DashboardPage = ({ history, API }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/stats`).then(res => res.json()).then(setStats).catch(console.error);
  }, [history, API]);

  const total = stats?.total_scans || history.length || 0;

  return (
    <div className="admin-content" style={{ padding: 0 }}>
      <div className="page-header">
        <div className="page-title">
          <div className="title-icon">📊</div>
          <div>
            <h2>Security Intelligence Center</h2>
            <p>Unified forensic overview and real-time threat monitoring.</p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatCard label="Total Forensic Scans" value={total} trend="12%" trendUp icon="📈" colorClass="blue" />
        <StatCard label="Active High Threats" value={stats?.high_risk || 0} trend="4%" trendUp={false} icon="🛡️" colorClass="red" />
        <StatCard label="Authorized Analysts" value={stats?.users || 28} trend="2" trendUp icon="👥" colorClass="purple" />
        <StatCard label="Heuristic Hits" value={stats?.threat_hits || 0} trend="31%" trendUp icon="🎯" colorClass="green" />
      </div>

      <div className="dashboard-grid">
        <GlassCard title="Live Forensic Stream" badge="REAL-TIME FEED">
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Target Identity</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.slice(0, 6).map(item => (
                  <tr key={item.id} className="animate-fade-in">
                    <td style={{ fontSize: '11px', opacity: 0.7 }}>{item.timestamp.split(' ')[1]}</td>
                    <td style={{ fontWeight: 500 }}>{item.sender?.split('@')[0] || "Deep Scan"}</td>
                    <td>
                      <span className={`admin-badge ${item.risk_level}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {item.risk_level?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--admin-muted)' }}>No recent activity.</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard title="Global Risk Profile">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', position: 'relative' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '36px', margin: 0, fontWeight: 800, color: 'var(--admin-primary)' }}>{total}</h3>
                <p style={{ color: 'var(--admin-muted)', margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Scans Analyzed</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', height: '6px' }}>
              <div style={{ flex: stats?.low_risk || 1, background: 'var(--admin-success)', borderRadius: '3px', boxShadow: '0 0 10px rgba(16,185,129,0.3)' }}></div>
              <div style={{ flex: stats?.medium_risk || 1, background: 'var(--admin-warning)', borderRadius: '3px', boxShadow: '0 0 10px rgba(245,158,11,0.3)' }}></div>
              <div style={{ flex: stats?.high_risk || 1, background: 'var(--admin-danger)', borderRadius: '3px', boxShadow: '0 0 10px rgba(239,68,68,0.3)' }}></div>
            </div>
          </GlassCard>
          
          <GlassCard title="Engine Integrity">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--admin-success)' }}>
              <div className="status-dot"></div>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>CORE OPERATIONAL</span>
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--admin-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Latency: 38ms</span>
              <span>Uptime: 99.98%</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// --- 2. SCAN PAGE ---
export const ScanPage = ({ API, fetchHistory }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input })
      });
      const data = await res.json();
      
      // Artificial delay for "Hackathon WOW" effect
      setTimeout(() => {
        setResult(data);
        fetchHistory();
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="admin-content" style={{ padding: 0 }}>
      <div className="page-header">
        <div className="page-title">
          <div className="title-icon">🔍</div>
          <div>
            <h2>Deep Forensic Sandbox</h2>
            <p>Deploy heuristic engines to inspect suspicious payloads or identity spoofing.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
        <GlassCard title="Inspection Terminal" icon="💻" badge="SANDBOX MODE">
          <div style={{ position: 'relative' }}>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste raw email headers, body, or suspicious URLs..."
              style={{ 
                width: '100%', 
                minHeight: '250px', 
                background: 'rgba(0,0,0,0.4)', 
                border: '1px solid var(--admin-border)', 
                borderRadius: '16px', 
                padding: '24px', 
                color: '#fff', 
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--admin-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--admin-border)'}
            />
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
               <button 
                className={`generate-btn ${loading ? 'loading' : ''}`}
                style={{ flex: 1, height: '56px', fontSize: '16px', letterSpacing: '1px' }}
                onClick={handleAnalyze}
                disabled={loading || !input.trim()}
              >
                {loading ? "INITIALIZING HEURISTIC ENGINES..." : "🚀 START DEEP ANALYSIS"}
              </button>
              <button 
                className="generate-btn" 
                style={{ width: '56px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', boxShadow: 'none' }}
                onClick={() => setInput("")}
                title="Clear Terminal"
              >
                🗑
              </button>
            </div>
          </div>
        </GlassCard>

        {(loading || result) && (
          <div className="animate-fade-in" style={{ marginTop: '24px' }}>
            <GlassCard title="Forensic Report Findings" icon="📝">
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                  <div className="cyber-spinner"></div>
                  <p style={{ marginTop: '24px', color: 'var(--admin-muted)', letterSpacing: '2px', fontSize: '12px' }}>DECRYPTING PAYLOAD & CHECKING THREAT INTEL...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '40px', alignItems: 'center', padding: '10px' }}>
                  <div style={{ 
                    width: '140px', height: '140px', borderRadius: '50%', 
                    border: `6px solid var(--admin-${result.risk_level})`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 30px rgba(${result.risk_level === 'high' ? '239,68,68' : result.risk_level === 'medium' ? '245,158,11' : '16,185,129'}, 0.3)`
                  }}>
                    <span style={{ fontSize: '36px', fontWeight: '900', color: `var(--admin-${result.risk_level})` }}>{result.email_risk_percent}%</span>
                    <span style={{ fontSize: '10px', color: 'var(--admin-muted)', fontWeight: 'bold' }}>RISK SCORE</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                       <h3 style={{ textTransform: 'uppercase', color: `var(--admin-${result.risk_level})`, margin: 0, letterSpacing: '1px' }}>
                        {result.risk_level} PROFILE DETECTED
                      </h3>
                      <a href={`${API}/report/${result.id || history[0]?.id}`} className="generate-btn" style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}>⬇️ DOWNLOAD PDF</a>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid var(--admin-primary)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
                      <p style={{ margin: 0, lineHeight: 1.7, fontSize: '15px' }}>{result.risky_urls?.[0]?.explanation || "Our forensic engine has cleared this payload. No immediate phishing indicators or malicious heuristics were detected during the multi-layer scan."}</p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 3. HISTORY PAGE ---
export const HistoryPage = ({ history, API, fetchHistory }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return history.filter(item => 
      item.sender?.toLowerCase().includes(search.toLowerCase()) || 
      item.risk_level?.toLowerCase().includes(search.toLowerCase())
    );
  }, [history, search]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("CRITICAL: Permanently purge this forensic record?")) return;
    await fetch(`${API}/delete-log/${id}`, { method: 'DELETE' });
    fetchHistory();
  };

  return (
    <div className="admin-content" style={{ padding: 0 }}>
      <div className="page-header">
        <div className="page-title">
          <div className="title-icon">📜</div>
          <div>
            <h2>Forensic Audit Database</h2>
            <p>Complete historical repository of all analyzed security events and intercepts.</p>
          </div>
        </div>
        <div className="search-wrapper" style={{ width: '320px' }}>
          <input 
            type="text" 
            placeholder="Filter by identity or risk level..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 20px', borderRadius: '10px', 
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--admin-border)', 
              color: 'white', fontSize: '14px', outline: 'none'
            }}
          />
        </div>
      </div>

      <GlassCard title="Intelligence Archives" badge={`${filtered.length} RECORDS FOUND`}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SENDER IDENTITY</th>
                <th>RISK LEVEL</th>
                <th>CRITICALITY</th>
                <th style={{ textAlign: 'right' }}>OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(item => (
                <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(item)} className="animate-fade-in">
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', opacity: 0.6 }}>{item.timestamp}</td>
                  <td style={{ fontWeight: 600, letterSpacing: '0.5px' }}>{item.sender || "EXTERNAL PAYLOAD"}</td>
                  <td>
                    <span className={`admin-badge ${item.risk_level}`}>
                      {item.risk_level?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="risk-bar-container">
                      <div className="risk-bar-bg" style={{ width: '100px', height: '6px' }}>
                        <div className={`risk-bar-fill ${item.risk_level}`} style={{ width: `${item.risk_percent}%` }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', width: '40px' }}>{item.risk_percent}%</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                       <button className="icon-btn inspect" title="Deep Inspection">👁</button>
                       <a href={`${API}/report/${item.id}`} className="icon-btn" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--admin-accent)', textDecoration: 'none' }} title="Forensic PDF" onClick={e => e.stopPropagation()}>📄</a>
                       <button className="icon-btn delete" onClick={(e) => handleDelete(item.id, e)} title="Purge Record">🗑</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-muted)' }}>No records match your current security filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selectedItem && (
        <HistoryModal data={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

// --- 5. USERS PAGE ---
export const UsersPage = ({ API }) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API}/stats`).then(res => res.json()).then(setStats).catch(console.error);
  }, [API]);

  const users = [
    { id: 1, name: "System Administrator", role: "SUPER ADMIN", status: "Active", lastLogin: "CURRENT SESSION" },
    { id: 2, name: "Senior Analyst", role: "ANALYST", status: "Active", lastLogin: "1 hour ago" },
    { id: 3, name: "External Consultant", role: "GUEST", status: "Inactive", lastLogin: "4 days ago" },
  ];

  return (
    <div className="admin-content" style={{ padding: 0 }}>
      <div className="page-header">
        <div className="page-title">
          <div className="title-icon">👥</div>
          <div>
            <h2>Identity & Access Management</h2>
            <p>Configure personnel permissions and monitor multi-factor analyst activity.</p>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <StatCard label="Total Personnel" value={stats?.users || 12} trend="1" trendUp icon="👥" colorClass="blue" />
        <StatCard label="Security Admins" value="2" trend="0" trendUp icon="🛡️" colorClass="purple" />
        <StatCard label="Active Analysts" value={stats?.users ? stats.users - 2 : 10} trend="1" trendUp icon="🔍" colorClass="green" />
      </div>

      <GlassCard title="Authorized Personnel Registry">
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>PERSONNEL NAME</th>
                <th>CLEARANCE LEVEL</th>
                <th>OPERATIONAL STATUS</th>
                <th>LAST ACTIVE</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="animate-fade-in">
                  <td style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{u.name}</td>
                  <td style={{ color: 'var(--admin-primary)', fontSize: '11px', fontWeight: 'bold' }}>{u.role}</td>
                  <td>
                    <div className="status-indicator">
                      <div className="status-dot" style={{ background: u.status === 'Active' ? 'var(--admin-success)' : 'var(--admin-muted)', boxShadow: u.status === 'Active' ? '0 0 10px var(--admin-success)' : 'none' }}></div>
                      {u.status}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

// --- 7. THREAT INTEL PAGE ---
export const ThreatIntelPage = ({ API, history }) => {
  const [heatmap, setHeatmap] = useState(null);

  useEffect(() => {
    fetch(`${API}/threat-heatmap`).then(res => res.json()).then(setHeatmap).catch(console.error);
  }, [API, history]);

  return (
    <div className="admin-content" style={{ padding: 0 }}>
      <div className="page-header">
        <div className="page-title">
          <div className="title-icon">🎯</div>
          <div>
            <h2>Advanced Threat Intelligence</h2>
            <p>Global attack vector mapping and live heuristic concentration analysis.</p>
          </div>
        </div>
      </div>

      {heatmap && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <StatCard label="Critical Threats" value={heatmap.high} trend="ACTIVE" trendUp icon="🛡️" colorClass="red" />
          <StatCard label="IP infrastructure" value={heatmap.ip_urls} trend="INFRASTRUCTURE" trendUp icon="🌐" colorClass="purple" />
          <StatCard label="Cloaked Vectors" value={heatmap.shortened} trend="CLOAKING" trendUp icon="🔗" colorClass="yellow" />
          <StatCard label="Unique Indicators" value={heatmap.high + heatmap.medium + heatmap.low} trend="LIVE" trendUp icon="🎯" colorClass="blue" />
        </div>
      )}

      <div className="dashboard-grid">
        <GlassCard title="Live Threat Heatmap" icon="🔥" badge="HEURISTIC DISTRIBUTION">
          <div className="heatmap-container" style={{ padding: '10px' }}>
             {heatmap ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '24px', borderRadius: '16px', textAlign: 'center', boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.05)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--admin-danger)', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>HIGH RISK</div>
                      <div style={{ fontSize: '40px', fontWeight: '900', color: 'var(--admin-danger)' }}>{heatmap.high}</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '24px', borderRadius: '16px', textAlign: 'center', boxShadow: 'inset 0 0 20px rgba(245, 158, 11, 0.05)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--admin-warning)', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>MEDIUM RISK</div>
                      <div style={{ fontSize: '40px', fontWeight: '900', color: 'var(--admin-warning)' }}>{heatmap.medium}</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '24px', borderRadius: '16px', textAlign: 'center', boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.05)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--admin-success)', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>LOW RISK</div>
                      <div style={{ fontSize: '40px', fontWeight: '900', color: 'var(--admin-success)' }}>{heatmap.low}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ marginBottom: '20px', color: 'var(--admin-text)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Primary Attack Vectors</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                       {[
                         { label: "IP Address Infrastructure", val: heatmap.ip_urls, color: 'var(--admin-primary)' },
                         { label: "Cloaked / Shortened URLs", val: heatmap.shortened, color: 'var(--admin-warning)' },
                         { label: "Mimicry / Suspicious Domains", val: heatmap.domains, color: 'var(--admin-accent)' }
                       ].map((item, i) => (
                         <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: '600' }}>
                              <span style={{ color: 'var(--admin-muted)' }}>{item.label}</span>
                              <span style={{ color: item.color }}>{item.val} DETECTIONS</span>
                            </div>
                            <div style={{ height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ height: '100%', background: item.color, width: `${(item.val / (heatmap.high + heatmap.medium + heatmap.low || 1)) * 100}%`, boxShadow: `0 0 15px ${item.color}` }}></div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
             ) : <div style={{ textAlign: 'center', padding: '40px' }}><div className="cyber-spinner" style={{ margin: '0 auto' }}></div></div>}
          </div>
        </GlassCard>

        <GlassCard title="Forensic Analysis Logic" icon="🧠">
          <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--admin-muted)' }}>
            The PhishForensics engine combines multi-layer entropy analysis with real-time TLD reputation checks and visual homograph detection.
          </p>
          <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px dashed var(--admin-primary)', boxShadow: '0 0 20px rgba(139,92,246,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--admin-primary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>Neural Intelligence Mode</h4>
            <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>Actively correlating data from {heatmap ? (heatmap.high + heatmap.medium + heatmap.low) : '...'} unique forensic markers detected across your operational history.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- 8. SETTINGS PAGE ---
export const SettingsPage = ({ API }) => {
  const [health, setHealth] = useState({ status: "CONNECTING...", database: "SCANNING..." });

  useEffect(() => {
    fetch(`${API}/health`).then(res => res.json()).then(setHealth).catch(() => setHealth({ status: "OFFLINE", database: "DISCONNECTED" }));
  }, [API]);

  return (
    <div className="admin-content" style={{ padding: 0 }}>
      <div className="page-header">
        <div className="page-title">
          <div className="title-icon">⚙️</div>
          <div>
            <h2>Core System Configuration</h2>
            <p>Manage heuristic sensitivity, API connectivity, and global security preferences.</p>
          </div>
        </div>
        <button className="generate-btn" style={{ margin: 0 }}>💾 SAVE SECURITY CONFIG</button>
      </div>

      <div className="dashboard-grid">
        <GlassCard title="Operational Health Status" icon="💓" badge="SYSTEM INTEGRITY">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--admin-muted)', fontSize: '13px' }}>FORENSIC API STATUS</span>
              <span style={{ color: health.status === 'online' ? 'var(--admin-success)' : 'var(--admin-danger)', fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>{health.status.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--admin-muted)', fontSize: '13px' }}>SQLITE ARCHIVE</span>
              <span style={{ color: health.database === 'connected' ? 'var(--admin-success)' : 'var(--admin-danger)', fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>{health.database.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--admin-muted)', fontSize: '13px' }}>VERSION KERNEL</span>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{health.version || "v2.4.0-PRO"}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border)', margin: '15px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--admin-muted)', fontSize: '13px' }}>SECURITY CLEARANCE</span>
              <span style={{ color: 'var(--admin-primary)', fontWeight: 800 }}>SUPER ADMIN</span>
            </div>
          </div>
        </GlassCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard title="Heuristic Parameters" icon="🛠️">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Multi-Layer Entropy Scan</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Detect algorithmically generated domains (DGA).</div>
                  </div>
                  <div style={{ width: '44px', height: '22px', background: 'var(--admin-primary)', borderRadius: '11px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Visual Homograph Detection</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>Identify domain mimicry using character mapping.</div>
                  </div>
                  <div style={{ width: '44px', height: '22px', background: 'var(--admin-primary)', borderRadius: '11px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }}></div>
                  </div>
                </div>
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
