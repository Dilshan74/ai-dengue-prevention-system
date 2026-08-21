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
