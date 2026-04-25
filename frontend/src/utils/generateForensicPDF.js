import { jsPDF } from 'jspdf';

export function generateForensicPDF(data, emailContent) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = {
    top: 48,
    right: 40,
    bottom: 48,
    left: 40
  };
  const maxWidth = pageWidth - margin.left - margin.right;

  let y = margin.top;

  const addPage = () => {
    doc.addPage();
    y = margin.top;
  };

  const ensureSpace = (requiredHeight = 16) => {
    if (y + requiredHeight > pageHeight - margin.bottom) {
      addPage();
    }
  };

  const toWrappedLines = (value) => {
    const raw = value === null || value === undefined || value === '' ? '-' : String(value);
    const normalized = raw.replace(/\r\n/g, '\n');
    const paragraphs = normalized.split('\n');
    const lines = [];

    paragraphs.forEach((paragraph, index) => {
      const split = doc.splitTextToSize(paragraph.length ? paragraph : ' ', maxWidth);
      lines.push(...split);

      if (index < paragraphs.length - 1) {
        lines.push('');
      }
    });

    return lines.length ? lines : ['-'];
  };

  const drawSectionTitle = (title) => {
    ensureSpace(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin.left, y);
    y += 10;
    doc.setDrawColor(170, 170, 170);
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += 14;
  };

  // Page break is checked per rendered line, so long text can flow to multiple pages safely.
  const drawWrapped = (text, options = {}) => {
    const {
      fontSize = 11,
      fontStyle = 'normal',
      color = [20, 20, 20],
      lineGap = 4,
      before = 0,
      after = 8
    } = options;

    if (before) {
      ensureSpace(before);
      y += before;
    }

    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lineHeight = fontSize + lineGap;
    const lines = toWrappedLines(text);

    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, margin.left, y);
      y += lineHeight;
    });

    if (after) {
      ensureSpace(after);
      y += after;
    }
  };

  const threatLevel = String(data?.risk_level || 'UNKNOWN').toUpperCase();
  const caseId = Date.now();
  const timestamp = new Date().toLocaleString();

  drawWrapped('Phishing Forensics Lab', {
    fontSize: 18,
    fontStyle: 'bold',
    color: [10, 10, 10],
    lineGap: 5,
    after: 6
  });

  drawWrapped('Phishing Incident Report', {
    fontSize: 13,
    fontStyle: 'italic',
    color: [60, 60, 60],
    lineGap: 4,
    after: 10
  });

  drawWrapped('Case ID: ' + caseId, { fontSize: 11, after: 5 });
  drawWrapped('Scan Timestamp: ' + timestamp, { fontSize: 11, after: 5 });
  drawWrapped('Threat Level: ' + threatLevel, {
    fontSize: 11,
    fontStyle: 'bold',
    color: threatLevel === 'HIGH' ? [180, 20, 20] : threatLevel === 'MEDIUM' ? [180, 120, 0] : [10, 130, 10],
    after: 14
  });

  drawSectionTitle('SECTION 1: ORIGINAL EMAIL');
  drawWrapped(emailContent || 'No email content provided.', {
    fontSize: 10,
    lineGap: 4,
    after: 12
  });

  drawSectionTitle('SECTION 2: HEADER ANALYSIS');
  drawWrapped('Sender: ' + (data?.email_analysis?.sender || 'N/A'), { after: 5 });
  drawWrapped('Return Path: ' + (data?.email_analysis?.return_path || 'N/A'), { after: 8 });

  if (data?.email_analysis?.spoofed) {
    drawWrapped('WARNING: Possible spoofing detected (Sender and Return-Path mismatch).', {
      fontStyle: 'bold',
      color: [170, 0, 0],
      after: 10
    });
  }

  drawSectionTitle('SECTION 3: MALICIOUS URL ANALYSIS');
  const riskyUrls = Array.isArray(data?.risky_urls) ? data.risky_urls : [];

  if (!riskyUrls.length) {
    drawWrapped('No risky URLs were identified.', { after: 10 });
  } else {
    riskyUrls.forEach((item, index) => {
      drawWrapped(String(index + 1) + '. URL: ' + (item?.original_url || 'N/A'), {
        fontStyle: 'bold',
        after: 2
      });
      drawWrapped('Risk: ' + (item?.risk_percent ?? 'N/A') + '%', { fontSize: 10, after: 2 });
      drawWrapped('Explanation: ' + (item?.explanation || 'No explanation available.'), {
        fontSize: 10,
        lineGap: 4,
        after: 8
      });
    });
  }

  drawSectionTitle('SECTION 4: SAFE URLS');
  const safeUrls = Array.isArray(data?.safe_urls) ? data.safe_urls : [];

  if (!safeUrls.length) {
    drawWrapped('No safe URLs detected in this email.', { after: 10 });
  } else {
    safeUrls.forEach((item, index) => {
      drawWrapped(String(index + 1) + '. ' + (item?.original_url || 'N/A'), {
        fontSize: 10,
        lineGap: 4,
        after: 6
      });
    });
  }

  drawSectionTitle('SECTION 5: FINAL VERDICT');
  drawWrapped('This email is classified as ' + threatLevel + ' risk.', {
    fontStyle: 'bold',
    after: 8
  });

  const verdictExplanation =
    threatLevel === 'HIGH'
      ? 'Multiple indicators strongly suggest a phishing attempt. Avoid interacting with links and report immediately.'
      : threatLevel === 'MEDIUM'
        ? 'Some suspicious indicators are present. Verify the sender and links before taking action.'
        : threatLevel === 'LOW'
          ? 'Only limited risk indicators were detected, but always verify sender identity and destination URLs.'
          : 'Risk level could not be determined with confidence. Please perform additional manual validation.';

  drawWrapped(verdictExplanation, {
    fontSize: 10,
    lineGap: 4,
    after: 12
  });

  doc.save('Forensic_Report.pdf');
}
