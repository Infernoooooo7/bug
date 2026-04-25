import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER

def generate_pdf_report(data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )
    
    Story = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e3a8a"),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#111827"),
        spaceBefore=15,
        spaceAfter=10
    )
    
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#374151"),
        spaceAfter=6,
        leading=14
    )
    
    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=normal_style,
        leftIndent=20,
        firstLineIndent=-10
    )
    
    alert_style = ParagraphStyle(
        'AlertStyle',
        parent=normal_style,
        textColor=colors.HexColor("#dc2626"),
        fontName='Helvetica-Bold'
    )

    # Risk variables
    risk_level = data.get("risk_level", "low").upper()
    risk_percent = data.get("email_risk_percent", 0)
    email_analysis = data.get("email_analysis", {})
    sender = email_analysis.get("sender", "Unknown")
    return_path = email_analysis.get("return_path", "Unknown")
    spoofed = email_analysis.get("spoofed", False)
    risky_urls = data.get("risky_urls", [])

    # Header
    Story.append(Paragraph("PhishForensics Intelligence Report", title_style))
    Story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    Story.append(Spacer(1, 12))

    # 1. Executive Summary
    Story.append(Paragraph("1. EXECUTIVE SUMMARY", heading_style))
    
    exec_summary = "This report details the forensic analysis of a suspicious payload. "
    if risk_percent >= 70:
        exec_summary += "The analyzed content exhibits multiple critical characteristics of a severe phishing attempt. "
        exec_summary += "The overall risk conclusion is HIGH, indicating a highly probable malicious intent, such as credential harvesting or malware distribution. Immediate defensive action is required."
    elif risk_percent >= 30:
        exec_summary += "The analyzed content exhibits suspicious characteristics warranting caution. "
        exec_summary += "The overall risk conclusion is MEDIUM. While it may not be a targeted attack, users should not interact with links until further manual verification."
    else:
        exec_summary += "The analyzed content does not currently exhibit strong indicators of a phishing attempt. "
        exec_summary += "The overall risk conclusion is LOW, though standard security hygiene should still be maintained."
    
    Story.append(Paragraph(exec_summary, normal_style))

    # 2. Threat Context
    Story.append(Paragraph("2. THREAT CONTEXT", heading_style))
    if risk_percent >= 30:
        Story.append(Paragraph("This attack payload is primarily dangerous because it leverages deceptive techniques to trick the recipient. If a user clicks the embedded links or interacts with the payload:", normal_style))
        Story.append(Paragraph("• They may be redirected to a credential harvesting portal designed to steal authentication tokens or passwords.", bullet_style))
        Story.append(Paragraph("• They could unknowingly trigger a drive-by download of malicious software.", bullet_style))
        Story.append(Paragraph("• Their interaction confirms the email address is active, leading to further targeted attacks.", bullet_style))
    else:
        Story.append(Paragraph("No immediate severe threat context identified. The payload appears benign based on automated heuristics.", normal_style))

    # 3. Threat Scoring Breakdown
    Story.append(Paragraph("3. THREAT SCORING BREAKDOWN", heading_style))
    
    # Calculate rough breakdown for presentation
    spoof_score = 25 if spoofed else 0
    url_score = max(0, risk_percent - spoof_score)
    
    score_data = [
        ["Component", "Risk Contribution"],
        ["Overall Risk Score", f"{risk_percent}%"],
        ["Email Authentication (Spoofing) Risk", f"{spoof_score}%"],
        ["URL & Domain Heuristics Risk", f"{url_score}%"]
    ]
    t = Table(score_data, colWidths=[300, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), colors.HexColor("#1f2937")),
        ('TEXTCOLOR', (0,0), (1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f3f4f6")),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#d1d5db")),
    ]))
    Story.append(t)
    Story.append(Spacer(1, 12))

    # 4. Email Authentication Analysis
    Story.append(Paragraph("4. EMAIL AUTHENTICATION ANALYSIS", heading_style))
    Story.append(Paragraph(f"<b>Sender:</b> {sender}", normal_style))
    Story.append(Paragraph(f"<b>Return-Path:</b> {return_path}", normal_style))
    if spoofed:
        Story.append(Paragraph("<b>Verdict:</b> SENDER MISMATCH DETECTED (Spoofing Likely)", alert_style))
        Story.append(Paragraph("The Sender domain does not match the Return-Path domain. This is a strong indicator of email spoofing. Attackers use this technique to bypass visual inspection by the user while directing bounce messages and backend routing to infrastructure they control. This often aligns with an SPF/DMARC alignment failure.", normal_style))
    else:
        Story.append(Paragraph("<b>Verdict:</b> No obvious sender mismatch detected in headers.", normal_style))

    # 5. URL Forensics
    Story.append(Paragraph("5. URL FORENSICS", heading_style))
    if not risky_urls:
        Story.append(Paragraph("No suspicious URLs were detected in the payload.", normal_style))
    else:
        for idx, url_data in enumerate(risky_urls, 1):
            url_risk = url_data.get("risk_percent", 0)
            verdict = "MALICIOUS" if url_risk >= 70 else "SUSPICIOUS" if url_risk >= 30 else "SAFE"
            
            Story.append(Paragraph(f"<b>Target #{idx}: {verdict} ({url_risk}% Risk)</b>", normal_style))
            Story.append(Paragraph(f"<b>Original URL:</b> {url_data.get('original_url', 'N/A')}", normal_style))
            Story.append(Paragraph(f"<b>Expanded URL:</b> {url_data.get('expanded_url', 'N/A')}", normal_style))
            
            # Highlight special conditions
            if "shortened" in url_data.get("explanation", "").lower():
                Story.append(Paragraph("⚠️ Uses URL Shortening (Obfuscation)", alert_style))
            if "raw ip" in url_data.get("explanation", "").lower():
                Story.append(Paragraph("⚠️ Uses Raw IP Address (Evasion)", alert_style))
                
            Story.append(Paragraph("<b>Indicators:</b>", normal_style))
            explanations = url_data.get("explanation", "").replace("This URL ", "").split(" and ")
            for exp in explanations:
                exp = exp.strip().replace(".", "")
                if exp and exp != "No major phishing indicators":
                    Story.append(Paragraph(f"• {exp.capitalize()}", bullet_style))
            Story.append(Spacer(1, 10))

    # 6. Attack Technique Analysis
    Story.append(Paragraph("6. ATTACK TECHNIQUE ANALYSIS", heading_style))
    techniques = []
    if spoofed:
        techniques.append("<b>Brand/Authority Impersonation:</b> The attacker is spoofing sender addresses to borrow credibility from trusted entities.")
    for u in risky_urls:
        exp = u.get("explanation", "").lower()
        if "shortened" in exp and "<b>URL Obfuscation:</b>" not in " ".join(techniques):
            techniques.append("<b>URL Obfuscation:</b> Shortened links are utilized to hide the true destination and bypass basic security filters.")
        if "raw ip" in exp and "<b>Raw IP Infrastructure:</b>" not in " ".join(techniques):
            techniques.append("<b>Raw IP Infrastructure:</b> The attacker is hosting payloads directly on IP addresses rather than registered domains, a common evasion tactic.")
        if "mimics sender" in exp and "<b>Visual Homograph/Lookalike:</b>" not in " ".join(techniques):
            techniques.append("<b>Visual Homograph/Lookalike:</b> The domain is designed to visually resemble the sender or a known brand to deceive the victim.")

    if techniques:
        for tech in techniques:
            Story.append(Paragraph(f"• {tech}", bullet_style))
    else:
        Story.append(Paragraph("No specific advanced attack techniques were definitively identified.", normal_style))

    # 7. Social Engineering Analysis
    Story.append(Paragraph("7. SOCIAL ENGINEERING ANALYSIS", heading_style))
    Story.append(Paragraph("While deep NLP analysis was not performed, the structural indicators suggest the attacker relies on deception. If this is a credential harvesting attempt, it likely employs urgency (e.g., 'Account Suspended') or authority impersonation to manipulate the user into bypassing logical scrutiny.", normal_style))

    # 8. Detailed Findings
    Story.append(Paragraph("8. DETAILED FINDINGS", heading_style))
    Story.append(Paragraph("The heuristic engine flagged the following systemic issues:", normal_style))
    if spoofed:
        Story.append(Paragraph("• Sender spoofing detected via header mismatch.", bullet_style))
    if risky_urls:
        for u in risky_urls:
            Story.append(Paragraph(f"• Link destination ({u.get('expanded_url')}) flagged for high entropy or suspicious keywords.", bullet_style))
    if not spoofed and not risky_urls:
         Story.append(Paragraph("• No major heuristic flags raised.", bullet_style))

    # 9. Impact Analysis
    Story.append(Paragraph("9. IMPACT ANALYSIS", heading_style))
    Story.append(Paragraph("If the attack is successful, potential organizational impacts include:", normal_style))
    Story.append(Paragraph("• <b>Credential Theft:</b> Unauthorized access to corporate or personal accounts.", bullet_style))
    Story.append(Paragraph("• <b>Data Exfiltration:</b> Loss of sensitive intellectual property or customer data.", bullet_style))
    Story.append(Paragraph("• <b>Lateral Movement:</b> Use of the compromised account to launch internal phishing attacks.", bullet_style))

    # 10. Recommendations
    Story.append(Paragraph("10. RECOMMENDATIONS", heading_style))
    Story.append(Paragraph("• <b>DO NOT CLICK</b> any links or download attachments from this payload.", bullet_style))
    Story.append(Paragraph("• Block identified malicious domains and IPs at the perimeter (Firewall/Secure Web Gateway).", bullet_style))
    Story.append(Paragraph("• Report the incident to the SOC / IT Security team immediately.", bullet_style))
    Story.append(Paragraph("• If a user has already interacted with the payload, enforce an immediate password reset and revoke active sessions.", bullet_style))

    # 11. Forensic Notes
    Story.append(Spacer(1, 20))
    Story.append(Paragraph("11. FORENSIC NOTES", heading_style))
    notes_style = ParagraphStyle('Notes', parent=normal_style, fontSize=8, textColor=colors.gray, fontName='Helvetica-Oblique')
    Story.append(Paragraph("Analysis performed using the automated PhishForensics detection engine.", notes_style))
    Story.append(Paragraph("Results may include heuristic, entropy-based, and threat intelligence signals. This report should be corroborated with manual analyst review where necessary.", notes_style))

    # Build PDF
    doc.build(Story)
    
    buffer.seek(0)
    return buffer.read()
