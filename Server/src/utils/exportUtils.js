import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const COLUMNS = [
  { header: "Report ID", key: "id", width: 14 },
  { header: "Date", key: "date", width: 14 },
  { header: "Location", key: "location", width: 26 },
  { header: "Status", key: "status", width: 20 },
  { header: "Risk", key: "risk", width: 10 },
  { header: "PHI", key: "phi", width: 18 },
];

export function toCsv(reports) {
  const header = COLUMNS.map((c) => c.header).join(",");
  const rows = reports.map((r) =>
    COLUMNS.map((c) => {
      const value = r[c.key] ?? "";
      const escaped = String(value).replace(/"/g, '""');
      return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(","),
  );
  return [header, ...rows].join("\n");
}

export async function toExcel(reports) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reports");
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true };
  reports.forEach((r) => sheet.addRow(r));
  return workbook.xlsx.writeBuffer();
}

export function toPdf(reports, title = "DengueGuard AI - Reports Export") {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(title, { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#666").text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown();

    const startX = doc.x;
    let y = doc.y;
    const colWidths = [70, 70, 160, 120, 60, 110];

    doc.fontSize(10).fillColor("#000").font("Helvetica-Bold");
    COLUMNS.forEach((c, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(c.header, x, y, { width: colWidths[i] });
    });
    y += 18;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
    y += 6;

    doc.font("Helvetica");
    reports.forEach((r) => {
      if (y > 520) {
        doc.addPage();
        y = 40;
      }
      COLUMNS.forEach((c, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(String(r[c.key] ?? ""), x, y, { width: colWidths[i] });
      });
      y += 18;
    });

    doc.end();
  });
}

export function generateAiReportPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const primaryColor = "#0f766e";
    const darkText = "#1e293b";
    const mutedText = "#64748b";
    const riskLevel = (data.machineLearningRiskLevel || "Low").toUpperCase();
    const riskColor = riskLevel === "HIGH" ? "#dc2626" : riskLevel === "MEDIUM" ? "#d97706" : "#059669";
    const riskBg = riskLevel === "HIGH" ? "#fee2e2" : riskLevel === "MEDIUM" ? "#fef3c7" : "#d1fae5";

    // 1. Header Banner
    doc.rect(45, 45, 505, 52).fill(primaryColor);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(15).text("DENGUEGUARD AI — RISK ASSESSMENT REPORT", 60, 56);
    doc.font("Helvetica").fontSize(9).fillColor("#ccfbf1").text("Automated YOLOv8 Computer Vision & Random Forest Multi-Factor Diagnostic", 60, 75);

    // 2. Metadata bar
    let y = 110;
    doc.rect(45, y, 505, 45).fill("#f8fafc").stroke("#e2e8f0");
    doc.fillColor(darkText).font("Helvetica-Bold").fontSize(9);
    doc.text("REPORT ID:", 55, y + 10);
    doc.font("Helvetica").text(data.reportId || "PRED-001", 125, y + 10);

    doc.font("Helvetica-Bold").text("LOCATION:", 270, y + 10);
    doc.font("Helvetica").text(data.location || "Not specified", 335, y + 10, { width: 200, ellipsis: true });

    doc.font("Helvetica-Bold").text("GENERATED:", 55, y + 26);
    doc.font("Helvetica").text(new Date(data.timestamp || Date.now()).toLocaleString(), 125, y + 26);

    doc.font("Helvetica-Bold").text("STATUS:", 270, y + 26);
    doc.font("Helvetica").text("Diagnostic Completed", 335, y + 26);

    // 3. Composite Risk Evaluation Card
    y = 170;
    doc.rect(45, y, 505, 60).fill(riskBg).stroke(riskColor);
    doc.fillColor(riskColor).font("Helvetica-Bold").fontSize(11).text(`COMPOSITE RISK LEVEL: ${data.machineLearningRiskScore || "0 / 100"}`, 60, y + 14);
    doc.fontSize(14).text(`${riskLevel} RISK DENGUE ZONE`, 60, y + 32);

    doc.fillColor(darkText).font("Helvetica").fontSize(8).text(
      "Computed via multi-factor ensemble: Visual Hazard Severity + Live Rainfall + Health Surveillance.",
      270,
      y + 24,
      { width: 260 }
    );

    // 4. Stage 1: Computer Vision Findings (YOLOv8)
    y = 245;
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(11).text("STAGE 1: YOLOv8 COMPUTER VISION OBJECT DETECTION", 45, y);
    doc.moveTo(45, y + 15).lineTo(550, y + 15).strokeColor("#cbd5e1").stroke();

    y += 22;
    doc.rect(45, y, 505, 20).fill("#f1f5f9");
    doc.fillColor(darkText).font("Helvetica-Bold").fontSize(8);
    doc.text("DETECTED HAZARD", 55, y + 6);
    doc.text("VISION CONFIDENCE", 230, y + 6);
    doc.text("BIOLOGICAL SEVERITY WEIGHT", 380, y + 6);

    y += 20;
    const hazards = data.detectedHazards || [];
    if (hazards.length === 0) {
      doc.rect(45, y, 505, 22).fill("#ffffff").stroke("#f1f5f9");
      doc.fillColor(mutedText).font("Helvetica-Oblique").fontSize(8).text("Clean site — No water-holding breeding containers detected by YOLOv8.", 55, y + 7);
      y += 22;
    } else {
      hazards.forEach((h, idx) => {
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(45, y, 505, 20).fill(rowBg).stroke("#f1f5f9");
        doc.fillColor(darkText).font("Helvetica").fontSize(8);
        doc.text(String(h.label || "Breeding Container"), 55, y + 6);
        doc.text(`${h.conf || data.yoloConfidence || 0}%`, 230, y + 6);
        doc.font("Helvetica-Bold").fillColor(riskColor).text(`${h.severity || data.visualSeverityScore || 50} / 100`, 380, y + 6);
        y += 20;
      });
    }

    // 5. Stage 2: 5-Factor Epidemiological & Meteorological Matrix
    y += 10;
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(11).text("STAGE 2: 5-FACTOR MACHINE LEARNING INPUT MATRIX", 45, y);
    doc.moveTo(45, y + 15).lineTo(550, y + 15).strokeColor("#cbd5e1").stroke();

    y += 22;
    const factors = [
      { label: "Visual Severity", val: `${data.visualSeverityScore || 0} / 100`, desc: "Container danger weight" },
      { label: "YOLO Confidence", val: `${data.yoloConfidence || "0%"}`, desc: "AI detection certainty" },
      { label: "Recent Rain (7-Day)", val: `${data.environmentalFactors?.rainfall7DayMm || 0} mm`, desc: "Open-Meteo satellite radar" },
      { label: "District NDCU Cases", val: `${data.environmentalFactors?.ndcuDistrictCases || 0}`, desc: "Active epidemiological records" },
      { label: "Report Density", val: `${data.environmentalFactors?.reportDensity2Km || 0} / 2km`, desc: "Active local cluster reports" },
    ];

    const boxWidth = 95;
    factors.forEach((f, idx) => {
      const bx = 45 + idx * (boxWidth + 7);
      doc.rect(bx, y, boxWidth, 42).fill("#f8fafc").stroke("#e2e8f0");
      doc.fillColor(mutedText).font("Helvetica").fontSize(7).text(f.label, bx + 5, y + 5);
      doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(9).text(f.val, bx + 5, y + 16);
      doc.fillColor(mutedText).font("Helvetica").fontSize(6).text(f.desc, bx + 5, y + 28, { width: boxWidth - 10 });
    });

    // 6. Actionable Eradication Recommendations
    y += 54;
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(11).text("ACTIONABLE VECTOR CONTROL RECOMMENDATIONS", 45, y);
    doc.moveTo(45, y + 15).lineTo(550, y + 15).strokeColor("#cbd5e1").stroke();

    y += 22;
    const recs = data.recommendations && data.recommendations.length > 0 ? data.recommendations : [
      "Empty and scrub all water-retaining receptacles immediately to eliminate mosquito larvae.",
      "Store unused tires and containers in dry, sheltered areas or dispose of them safely.",
    ];
    recs.forEach((rec) => {
      doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(9).text("• ", 55, y);
      doc.fillColor(darkText).font("Helvetica").fontSize(8).text(rec, 65, y, { width: 475 });
      y += 16;
    });

    // 7. Official Field Verification & Sign-off
    y = 660;
    doc.rect(45, y, 505, 80).fill("#f8fafc").stroke("#cbd5e1");
    doc.fillColor(darkText).font("Helvetica-Bold").fontSize(8).text("PUBLIC HEALTH INSPECTION (PHI) VERIFICATION & ACTION LOG", 55, y + 8);
    doc.font("Helvetica").fontSize(7).fillColor(mutedText).text("To be completed by assigned Public Health Inspector during on-site visit.", 55, y + 19);

    doc.moveTo(55, y + 60).lineTo(220, y + 60).strokeColor("#94a3b8").stroke();
    doc.font("Helvetica").fontSize(7).fillColor(mutedText).text("Assigned PHI Officer Signature", 55, y + 64);

    doc.moveTo(250, y + 60).lineTo(370, y + 60).strokeColor("#94a3b8").stroke();
    doc.text("Field Inspection Date", 250, y + 64);

    doc.moveTo(400, y + 60).lineTo(535, y + 60).strokeColor("#94a3b8").stroke();
    doc.text("Official MOH Stamp", 400, y + 64);

    // 8. Footer
    doc.fillColor("#94a3b8").font("Helvetica").fontSize(7).text(
      "DengueGuard AI Prevention System · National Dengue Control Unit (NDCU) Protocol · Document ID: " + (data.reportId || "PRED"),
      45,
      760,
      { align: "center", width: 505 }
    );

    doc.end();
  });
}
