const API_URL = "https://teamcrackers.onrender.com/analyze";

document.getElementById("scanBtn").addEventListener("click", async () => {
    const emailText = document.getElementById("emailInput").value;

    try {
        console.log("Sending request to:", API_URL);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: emailText
            })
        });

        if (!response.ok) {
            console.error("HTTP error:", response.status);
            return;
        }

        const data = await response.json();
        console.log("Response:", data);

        document.getElementById("result").innerText =
            `Risk: ${data.risk_level} (${data.email_risk_percent}%)`;

    } catch (error) {
        console.error("Fetch error:", error);
    }
});