import XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";

const asNumber = (value) => Number(value || 0);
const REPORT_NAVY = "1F2937";
const REPORT_PRIMARY_ORANGE = "FF9800";
const REPORT_BORDER = "D1D5DB";
const REPORT_SOFT = "F8FAFC";

const normalizeFilePart = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const formatReportDate = (value) => moment(value).format("DD-MM-YYYY");

const getCurrencyColumnIndexes = (columns = []) =>
  columns.reduce((acc, column, index) => {
    if (column.type === "currency") acc.add(index);
    return acc;
  }, new Set());

const formatPdfCellValue = (row, column) => {
  if (column.type === "currency") {
    /**
     * Spasi setelah "Rp." mudah dipecah baris oleh jsPDF ketika kolom sempit.
     * Untuk PDF laporan, nominal dibuat rapat agar tetap satu baris dan mudah
     * dipindai sebagai nilai uang.
     */
    return formatRupiah(row[column.key]).replace("Rp. ", "Rp.");
  }

  return row[column.key] ?? "-";
};

/**
 * Logo laporan dimuat dari public folder saat export PDF berjalan di browser.
 * Jika gagal dimuat, export tetap berjalan dengan fallback badge huruf S.
 */
const loadImageAsDataUrl = async (src) => {
  if (!src || typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = window.document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        console.error("Gagal memuat logo export PDF:", error);
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
};

/**
 * Mengubah data laporan menjadi format baris export.
 * Definisi kolom dipakai bersama untuk Excel dan PDF agar isi laporan konsisten.
 */
export const buildExportRows = ({ rows = [], columns = [] }) =>
  rows.map((row) =>
    columns.reduce((acc, column) => {
      acc[column.header] =
        column.type === "currency"
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
  subtitle,
  filterInfo = [],
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
        acc[column.header] =
          index === 0 ? "TOTAL" : (totalsRow[column.key] ?? "");
        return acc;
      }, {}),
    );
  }

  const tableStartRow = filterInfo.length || subtitle ? 5 : 3;
  const ws = XLSX.utils.json_to_sheet(exportRows, {
    origin: `A${tableStartRow}`,
  });
  XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" });

  if (subtitle) {
    XLSX.utils.sheet_add_aoa(ws, [[subtitle]], { origin: "A2" });
  }

  if (filterInfo.length) {
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          `Filter Laporan: ${filterInfo
            .map((item) => `${item.label}: ${item.value}`)
            .join(" | ")}`,
        ],
      ],
      { origin: "A3" },
    );
  }

  const columnCount = columns.length;
  const lastColumnIndex = Math.max(columnCount - 1, 0);
  const currencyColumnIndexes = getCurrencyColumnIndexes(columns);
  ws["!cols"] = columns.map((column) => ({ wch: column.width || 18 }));
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } }];

  if (subtitle) {
    ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColumnIndex } });
  }

  if (filterInfo.length) {
    ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColumnIndex } });
  }

  const titleCell = ws.A1;
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 15, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: REPORT_NAVY } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  if (subtitle && ws.A2) {
    ws.A2.s = {
      font: { bold: false, sz: 11, color: { rgb: "475569" } },
      fill: { fgColor: { rgb: REPORT_SOFT } },
      alignment: { horizontal: "left", vertical: "center" },
    };
  }

  if (filterInfo.length && ws.A3) {
    ws.A3.s = {
      font: { bold: true, sz: 10, color: { rgb: "334155" } },
      fill: { fgColor: { rgb: "F1F5F9" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: REPORT_PRIMARY_ORANGE } },
      },
    };
  }

  const headerRow = tableStartRow - 1;
  for (let c = 0; c < columnCount; c += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: REPORT_NAVY } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: REPORT_BORDER } },
        bottom: { style: "thin", color: { rgb: REPORT_BORDER } },
      },
    };
  }

  const totalRowIndex = exportRows.length + headerRow;
  for (let r = tableStartRow; r <= totalRowIndex; r += 1) {
    for (let c = 0; c < columnCount; c += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellAddress]) continue;
      const isTotal = r === totalRowIndex && Boolean(totalsRow);
      const isOddRow = (r - tableStartRow) % 2 === 1;
      ws[cellAddress].s = {
        font: { bold: isTotal },
        fill: isTotal
          ? { fgColor: { rgb: "FEF3C7" } }
          : isOddRow
            ? { fgColor: { rgb: REPORT_SOFT } }
            : undefined,
        alignment: {
          horizontal:
            c === 0
              ? "left"
              : currencyColumnIndexes.has(c)
                ? "right"
                : "center",
          vertical: "center",
          wrapText: !currencyColumnIndexes.has(c),
        },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };

      if (
        currencyColumnIndexes.has(c) &&
        typeof ws[cellAddress].v === "number"
      ) {
        ws[cellAddress].z = '"Rp" #,##0';
      }
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

const logoImagePath = "/sewain-s-icon-orange.png";

export const exportReportToPDF = async ({
  title,
  subtitle,
  filterInfo = [],
  fileName,
  rows,
  columns,
  totalsRow,
  printedAtFooter = false,
  showLogoMark = false,
}) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const printedAt = moment().format("DD-MM-YYYY HH:mm:ss");
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerTop = 12;
  const headerHeight = filterInfo.length ? 34 : 24;
  const logoDataUrl = await loadImageAsDataUrl(logoImagePath);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, headerTop, pageWidth - 24, headerHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, headerTop, pageWidth - 24, headerHeight, 2, 2, "S");
  doc.setFillColor(255, 152, 0);
  doc.rect(16, headerTop + 5, 1.5, headerHeight - 10, "F");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 22, headerTop + 9);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 22, headerTop + 16);
  }

  if (showLogoMark) {
    const logoX = pageWidth - 31;
    const logoY = headerTop + 7;
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", logoX, logoY, 10, 10);
    } else {
      doc.setFillColor(255, 152, 0);
      doc.roundedRect(logoX, logoY, 10, 10, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("S", logoX + 5, logoY + 6.5, { align: "center" });
    }
  }

  if (filterInfo.length) {
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Filter Laporan", 12, headerTop + headerHeight + 8);

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.text(
      filterInfo.map((item) => `${item.label}: ${item.value}`).join("   |   "),
      12,
      headerTop + headerHeight + 14,
    );
  }

  const currencyColumnIndexes = getCurrencyColumnIndexes(columns);
  const columnStyles = columns.reduce((acc, column, index) => {
    if (column.type === "currency") {
      acc[index] = {
        halign: "right",
        cellWidth: column.pdfWidth || 28,
        overflow: "visible",
      };
    }
    return acc;
  }, {});

  const body = rows.map((row) =>
    columns.map((column) => formatPdfCellValue(row, column)),
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
    startY: headerTop + headerHeight + (filterInfo.length ? 20 : 8),
    theme: "grid",
    styles: {
      fontSize: 7.8,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [203, 213, 225],
      lineWidth: 0.08,
      valign: "middle",
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    bodyStyles: { valign: "middle" },
    columnStyles,
    didParseCell: (data) => {
      if (data.section === "body" && currencyColumnIndexes.has(data.column.index)) {
        data.cell.styles.halign = "right";
      }

      if (totalsRow && data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [254, 243, 199];
      }
    },
  });

  if (printedAtFooter) {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text(
        `Dicetak: ${printedAt} | Halaman ${page}/${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: "right" },
      );
    }
  }

  doc.save(fileName);
};

/**
 * Membuat nama file report yang stabil dan mudah dicari di folder download.
 */
export const buildReportFileName = ({
  prefix,
  startDate,
  endDate,
  filterName,
  extension,
}) =>
  [
    normalizeFilePart(prefix),
    filterName ? normalizeFilePart(filterName) : null,
    `${formatReportDate(startDate)}_sd_${formatReportDate(endDate)}`,
  ]
    .filter(Boolean)
    .join("_")
    .concat(`.${extension}`);
