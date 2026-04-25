import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const API = "http://10.115.31.83:8000";

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
    try {
      const res = await fetch(`${API}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const generatePDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("NMAMIT Phishing Forensics Report", 10, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Timestamp: ${new Date().toLocaleString()}`, 10, y);
    y += 6;

    doc.text(`Sender: ${result.email_analysis.sender}`, 10, y);
    y += 6;

    doc.text(`Return Path: ${result.email_analysis.return_path}`, 10, y);
    y += 6;

    doc.text(`Risk: ${result.risk_level.toUpperCase()} (${result.email_risk_percent}%)`, 10, y);
    y += 10;

    doc.text("----- Email Content -----", 10, y);
    y += 6;

    const emailText = doc.splitTextToSize(input, 180);
    doc.text(emailText, 10, y);
    y += emailText.length * 5 + 6;

    doc.text("----- Malicious URLs -----", 10, y);
    y += 6;

    result.risky_urls.forEach((url, i) => {
      doc.text(`${i + 1}. ${url.original_url}`, 10, y);
      y += 5;

      doc.text(`Risk: ${url.risk_percent}%`, 10, y);
      y += 5;

      const exp = doc.splitTextToSize(url.explanation, 180);
      doc.text(exp, 10, y);
      y += exp.length * 5 + 6;
    });

    doc.save("phishing_report.pdf");
  };

  return (
    <div className="container">

      <h1 className="title">
        Phish<span className="highlight">Forensics</span> Sandbox
      </h1>

      {/* INPUT */}
      <div className="glass-card">
        <h2>Target Payload</h2>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste email here..."
        />

        <button onClick={analyze}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* RESULT */}
      {result && (
        <>
          <div className="glass-card">
            <h2>Threat Level</h2>

            <p className={`threat ${result.risk_level}`}>
              {result.email_risk_percent}% — {result.risk_level.toUpperCase()}
            </p>

            <button onClick={generatePDF}>
              Download Report
            </button>
          </div>

          <div className="glass-card">
            <h2>Risky URLs</h2>

            {result.risky_urls.map((url, i) => (
              <div key={i} className="url-block">

                <p>{url.original_url}</p>
                <p>Risk: {url.risk_percent}%</p>

                <div className="risk-bar">
                  <div
                    className={`risk-fill ${
                      url.risk_percent > 70
                        ? "high"
                        : url.risk_percent > 30
                        ? "medium"
                        : "low"
                    }`}
                    style={{ width: `${url.risk_percent}%` }}
                  ></div>
                </div>

                <p>{url.explanation}</p>

              </div>
            ))}
          </div>
        </>
      )}

      {/* HISTORY */}
      <div className="glass-card">
        <h2>Scan History</h2>

        {history.map((item) => (
          <div key={item.id} className={`history-card ${item.risk_level}`}>

            <div className="history-header">
              <span>{item.timestamp}</span>
              <span className={`badge ${item.risk_level}`}>
                {item.risk_level}
              </span>
            </div>

            <p>{item.sender}</p>

            <div className="risk-bar">
              <div
                className={`risk-fill ${item.risk_level}`}
                style={{ width: `${item.risk_percent}%` }}
              ></div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default App;