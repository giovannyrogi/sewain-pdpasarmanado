import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";

const asNumber = (value) => Number(value || 0);

/**
 * Mengubah data laporan menjadi format baris export.
 * Definisi kolom dipakai bersama untuk Excel dan PDF agar isi laporan konsisten.
 */
export const buildExportRows = ({ rows = [], columns = [] }) =>
  rows.map((row) =>
    columns.reduce((acc, column) => {
      acc[column.header] = column.type === "currency"
        ? asNumber(row[column.key])
        : (row[column.key] ?? "-");
      return acc;
    }, {}),
  );

/**
 * Export Excel generik untuk laporan pendapatan.
 * Styling dibuat sederhana dan formal karena file ini dipakai sebagai laporan.
 */
export const exportReportToExcel = ({
  title,
  fileName,
  sheetName,
  rows,
  columns,
  totalsRow,
}) => {
  const exportRows = buildExportRows({ rows, columns });

  if (totalsRow) {
    exportRows.push(
      columns.reduce((acc, column, index) => {
        acc[column.header] = index === 0 ? "TOTAL" : (totalsRow[column.key] ?? "");
        return acc;
      }, {}),
    );
  }

  const ws = XLSX.utils.json_to_sheet(exportRows, { origin: "A3" });
  XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" });

  const columnCount = columns.length;
  ws["!cols"] = columns.map((column) => ({ wch: column.width || 18 }));
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(columnCount - 1, 0) } },
  ];

  const titleCell = ws.A1;
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 15, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F2937" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  const headerRow = 2;
  for (let c = 0; c < columnCount; c += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "E60909" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
      },
    };
  }

  const totalRowIndex = exportRows.length + 2;
  for (let r = 3; r <= totalRowIndex; r += 1) {
    for (let c = 0; c < columnCount; c += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddress]) continue;
      const isTotal = r === totalRowIndex && Boolean(totalsRow);
      ws[cellAddress].s = {
        font: { bold: isTotal },
        fill: isTotal ? { fgColor: { rgb: "FEE2E2" } } : undefined,
        alignment: { horizontal: c === 0 ? "left" : "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};

/**
 * Export PDF generik untuk laporan pendapatan.
 * Nilai currency diformat sebagai Rupiah agar siap dibaca tanpa proses manual.
 */
export const exportReportToPDF = ({
  title,
  fileName,
  rows,
  columns,
  totalsRow,
}) => {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(12);
  doc.text(title, 14, 12);

  const body = rows.map((row) =>
    columns.map((column) =>
      column.type === "currency"
        ? formatRupiah(row[column.key])
        : (row[column.key] ?? "-"),
    ),
  );

  if (totalsRow) {
    body.push(
      columns.map((column, index) =>
        index === 0
          ? "TOTAL"
          : column.type === "currency"
            ? formatRupiah(totalsRow[column.key])
            : (totalsRow[column.key] ?? ""),
      ),
    );
  }

  autoTable(doc, {
    head: [columns.map((column) => column.header)],
    body,
    startY: 18,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(fileName);
};

/**
 * Membuat nama file report yang stabil dan mudah dicari di folder download.
 */
export const buildReportFileName = ({ prefix, startDate, endDate, extension }) =>
  `${prefix}_${moment(startDate).format("DD-MM-YYYY")}_sd_${moment(endDate).format(
    "DD-MM-YYYY",
  )}.${extension}`;
