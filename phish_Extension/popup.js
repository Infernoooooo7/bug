document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const input = document.getElementById('input').value;
    const resultDiv = document.getElementById('result');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!input.trim()) return;
    
    analyzeBtn.disabled = true;
    resultDiv.textContent = "Analyzing...";
    
    try {
        const API = "https://teamcrackers.onrender.com";
        console.log("Sending request to:", `${API}/analyze`);
        const res = await fetch(`${API}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input })
        });
        
        const data = await res.json();
        console.log("Response:", data);
        
        let color = "#10B981"; // Low risk
        if (data.risk_level === "medium") color = "#F59E0B";
        if (data.risk_level === "high") color = "#EF4444";
        
        resultDiv.innerHTML = `
          <strong style="color: ${color}">Risk Level: ${data.risk_level.toUpperCase()}</strong><br>
          Score: ${data.email_risk_percent}%
        `;
    } catch (e) {
        resultDiv.textContent = "Error connecting to server. Is FastAPI running?";
    } finally {
        analyzeBtn.disabled = false;
    }
});
