document.getElementById('analyze-btn').addEventListener('click', async () => {
    const inputArea = document.getElementById('input');
    const resultDiv = document.getElementById('result');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    let content = inputArea.value;

    // If textarea is empty, try to scrape current page text
    if (!content.trim()) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const [{ result }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => document.body.innerText
            });
            content = result;
        } catch (e) {
            console.error("Scraping failed:", e);
        }
    }

    if (!content || !content.trim()) {
        resultDiv.textContent = "Please provide content or open a page to analyze.";
        return;
    }
    
    analyzeBtn.disabled = true;
    resultDiv.textContent = "Analyzing...";
    console.log("Request sent");
    
    try {
        const API = "https://teamcrackers.onrender.com";
        const res = await fetch(`${API}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content })
        });
        
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        
        const data = await res.json();
        console.log("Response received:", data);
        
        // Map backend fields to UI display
        const riskScore = data.email_risk_percent || 0;
        const details = data.risk_level || "unknown";
        
        let color = "#10B981"; // Low risk
        if (details === "medium") color = "#F59E0B";
        if (details === "high") color = "#EF4444";
        
        resultDiv.innerHTML = `
          <div style="margin-top: 15px; padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.05);">
            <div style="font-size: 12px; color: #888; margin-bottom: 5px;">THREAT LEVEL</div>
            <strong style="color: ${color}; font-size: 18px;">${details.toUpperCase()}</strong>
            <div style="font-size: 12px; color: #888; margin-top: 10px; margin-bottom: 5px;">RISK SCORE</div>
            <div style="font-size: 24px; font-weight: bold;">${riskScore}%</div>
          </div>
        `;
    } catch (e) {
        console.error("Failed to fetch:", e);
        resultDiv.textContent = "Error: Could not connect to forensic server.";
    } finally {
        analyzeBtn.disabled = false;
    }
});