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
const PDF_PAGE_MARGIN = 12;

const normalizeFilePart = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const formatReportDate = (value) => moment(value).format("DD-MM-YYYY");

const normalizeSheetName = (value, fallback = "Laporan") =>
  String(value || fallback)
    .replace(/[\\/?*\[\]:]+/g, " ")
    .trim()
    .slice(0, 31) || fallback;

const formatFilterInfoText = (filterInfo = []) =>
  filterInfo.map((item) => `${item.label}: ${item.value}`).join(" | ");

const formatSummaryInfoText = (summaryInfo = []) =>
  summaryInfo.map((item) => `${item.label}: ${item.value}`).join(" | ");

const getCurrencyColumnIndexes = (columns = []) =>
  columns.reduce((acc, column, index) => {
    if (column.type === "currency") acc.add(index);
    return acc;
  }, new Set());

const buildPdfColumnStyles = (columns = []) =>
  columns.reduce((acc, column, index) => {
    const style = {};

    if (column.pdfWidth) {
      style.cellWidth = column.pdfWidth;
    }

    if (column.type === "currency") {
      style.halign = "right";
      style.cellWidth = column.pdfWidth || 28;
      style.overflow = "visible";
    }

    if (column.pdfHalign) {
      style.halign = column.pdfHalign;
    }

    if (column.pdfValign) {
      style.valign = column.pdfValign;
    }

    if (column.pdfOverflow) {
      style.overflow = column.pdfOverflow;
    }

    if (column.pdfCellPadding !== undefined) {
      style.cellPadding = column.pdfCellPadding;
    }

    if (column.pdfFontSize) {
      style.fontSize = column.pdfFontSize;
    }

    if (Object.keys(style).length) {
      acc[index] = style;
    }

    return acc;
  }, {});

const getPdfTableSizing = (columns = []) => {
  if (columns.some((column) => column.pdfFontSize || column.pdfWidth)) {
    return {
      fontSize: Math.min(
        7.8,
        ...columns
          .map((column) => column.pdfFontSize)
          .filter((value) => Number.isFinite(value)),
      ),
      cellPadding: columns.length >= 12 ? 1.35 : 2,
    };
  }

  if (columns.length >= 12) {
    return { fontSize: 6.7, cellPadding: 1.45 };
  }

  if (columns.length >= 9) {
    return { fontSize: 7.2, cellPadding: 1.65 };
  }

  return { fontSize: 7.8, cellPadding: 2 };
};

const getPdfTotalColumn = (columns = [], totalsRow = {}) => {
  const columnsWithTotals = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) =>
      Object.prototype.hasOwnProperty.call(totalsRow, column.key),
    );

  return (
    [...columnsWithTotals].reverse().find(({ column }) => column.type === "currency") ||
    columnsWithTotals[columnsWithTotals.length - 1] ||
    null
  );
};

const buildPdfTotalRow = (columns = [], totalsRow = {}) => {
  const totalColumn = getPdfTotalColumn(columns, totalsRow);
  const totalValue = totalColumn
    ? totalsRow[totalColumn.column.key]
    : totalsRow.total || totalsRow.total_income || totalsRow.total_payment || "";

  return [
    {
      content: "TOTAL",
      colSpan: Math.max(columns.length - 1, 1),
      styles: {
        halign: "right",
        fontStyle: "bold",
      },
    },
    {
      content:
        totalColumn?.column?.type === "currency"
          ? formatRupiah(totalValue)
          : (totalValue ?? ""),
      styles: {
        halign: totalColumn?.column?.type === "currency" ? "right" : "left",
        fontStyle: "bold",
      },
    },
  ];
};

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
  sections = [],
  summaryInfo = [],
}) => {
  if (Array.isArray(sections) && sections.length) {
    const wb = XLSX.utils.book_new();

    sections.forEach((section, sectionIndex) => {
      const sectionColumns = section.columns || columns || [];
      const sectionRows = buildExportRows({
        rows: section.rows || [],
        columns: sectionColumns,
      });

      if (section.totalsRow) {
        sectionRows.push(
          sectionColumns.reduce((acc, column, index) => {
            acc[column.header] =
              index === 0 ? "TOTAL" : (section.totalsRow[column.key] ?? "");
            return acc;
          }, {}),
        );
      }

      const tableStartRow = filterInfo.length || subtitle ? 6 : 4;
      const ws = XLSX.utils.json_to_sheet(sectionRows, {
        origin: `A${tableStartRow}`,
      });
      const sectionTitle = section.title || `${title} ${sectionIndex + 1}`;
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" });

      if (subtitle) {
        XLSX.utils.sheet_add_aoa(ws, [[subtitle]], { origin: "A2" });
      }

      if (filterInfo.length) {
        XLSX.utils.sheet_add_aoa(ws, [[`Filter Laporan: ${formatFilterInfoText(filterInfo)}`]], {
          origin: "A3",
        });
      }

      XLSX.utils.sheet_add_aoa(ws, [[sectionTitle]], {
        origin: `A${tableStartRow - 2}`,
      });

      const columnCount = sectionColumns.length;
      const lastColumnIndex = Math.max(columnCount - 1, 0);
      const currencyColumnIndexes = getCurrencyColumnIndexes(sectionColumns);
      ws["!cols"] = sectionColumns.map((column) => ({ wch: column.width || 18 }));
      ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } },
        {
          s: { r: tableStartRow - 3, c: 0 },
          e: { r: tableStartRow - 3, c: lastColumnIndex },
        },
      ];

      if (subtitle) {
        ws["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColumnIndex } });
      }

      if (filterInfo.length) {
        ws["!merges"].push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColumnIndex } });
      }

      if (ws.A1) {
        ws.A1.s = {
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

      const sectionTitleCell = XLSX.utils.encode_cell({
        r: tableStartRow - 3,
        c: 0,
      });
      if (ws[sectionTitleCell]) {
        ws[sectionTitleCell].s = {
          font: { bold: true, sz: 12, color: { rgb: REPORT_NAVY } },
          fill: { fgColor: { rgb: "FEF3C7" } },
          alignment: { horizontal: "left", vertical: "center" },
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

      const totalRowIndex = sectionRows.length + headerRow;
      for (let r = tableStartRow; r <= totalRowIndex; r += 1) {
        for (let c = 0; c < columnCount; c += 1) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          if (!ws[cellAddress]) continue;
          const isTotal = r === totalRowIndex && Boolean(section.totalsRow);
          const isOddRow = (r - tableStartRow) % 2 === 1;
          ws[cellAddress].s = {
            font: { bold: isTotal },
            fill: isTotal
              ? undefined
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

          if (currencyColumnIndexes.has(c) && typeof ws[cellAddress].v === "number") {
            ws[cellAddress].z = '"Rp" #,##0';
          }
        }
      }

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        normalizeSheetName(section.sheetName, `Laporan ${sectionIndex + 1}`),
      );
    });

    XLSX.writeFile(wb, fileName);
    return;
  }

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

  const tableStartRow = (filterInfo.length || subtitle ? 5 : 3) + (summaryInfo.length ? 1 : 0);
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
          `Filter Laporan: ${formatFilterInfoText(filterInfo)}`,
        ],
      ],
      { origin: "A3" },
    );
  }

  if (summaryInfo.length) {
    XLSX.utils.sheet_add_aoa(
      ws,
      [[`Ringkasan Status: ${formatSummaryInfoText(summaryInfo)}`]],
      { origin: filterInfo.length || subtitle ? "A4" : "A2" },
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

  if (summaryInfo.length) {
    const summaryRowIndex = filterInfo.length || subtitle ? 3 : 1;
    ws["!merges"].push({
      s: { r: summaryRowIndex, c: 0 },
      e: { r: summaryRowIndex, c: lastColumnIndex },
    });
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

  const summaryCellAddress = filterInfo.length || subtitle ? "A4" : "A2";
  if (summaryInfo.length && ws[summaryCellAddress]) {
    ws[summaryCellAddress].s = {
      font: { bold: true, sz: 10, color: { rgb: "334155" } },
      fill: { fgColor: { rgb: "F8FAFC" } },
      alignment: { horizontal: "left", vertical: "center" },
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
          ? undefined
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
  sections = [],
  printedAtFooter = false,
  showLogoMark = false,
  summaryInfo = [],
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

  const drawReportTable = ({
    sectionRows = [],
    sectionColumns = [],
    sectionTotalsRow,
    startY,
  }) => {
    const currencyColumnIndexes = getCurrencyColumnIndexes(sectionColumns);
    const columnStyles = buildPdfColumnStyles(sectionColumns);
    const tableSizing = getPdfTableSizing(sectionColumns);

    const body = sectionRows.map((row) =>
      sectionColumns.map((column) => formatPdfCellValue(row, column)),
    );

    if (sectionTotalsRow) {
      body.push(buildPdfTotalRow(sectionColumns, sectionTotalsRow));
    }

    autoTable(doc, {
      head: [sectionColumns.map((column) => column.header)],
      body,
      startY,
      margin: { left: PDF_PAGE_MARGIN, right: PDF_PAGE_MARGIN },
      theme: "grid",
      styles: {
        fontSize: tableSizing.fontSize,
        cellPadding: tableSizing.cellPadding,
        textColor: [31, 41, 55],
        lineColor: [203, 213, 225],
        lineWidth: 0.08,
        valign: "middle",
        overflow: "linebreak",
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
        const isTotalRow = sectionTotalsRow && data.row.index === body.length - 1;

        if (data.section === "body" && currencyColumnIndexes.has(data.column.index)) {
          data.cell.styles.halign = "right";
        }

        if (isTotalRow) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.valign = "middle";
        }
      },
    });

    return doc.lastAutoTable?.finalY || startY;
  };

  if (Array.isArray(sections) && sections.length) {
    let currentY = headerTop + headerHeight + (filterInfo.length ? 24 : 12);
    const pageHeight = doc.internal.pageSize.getHeight();

    sections.forEach((section, index) => {
      if (index > 0 && currentY > pageHeight - 45) {
        doc.addPage();
        currentY = 16;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(section.title || `Bagian ${index + 1}`, 12, currentY);
      currentY += 4;

      currentY =
        drawReportTable({
          sectionRows: section.rows || [],
          sectionColumns: section.columns || [],
          sectionTotalsRow: section.totalsRow,
          startY: currentY + 2,
        }) + 10;
    });

    if (printedAtFooter) {
      const pageCount = doc.getNumberOfPages();
      const footerPageWidth = doc.internal.pageSize.getWidth();
      const footerPageHeight = doc.internal.pageSize.getHeight();

      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        doc.text(
          `Dicetak: ${printedAt} | Halaman ${page}/${pageCount}`,
          footerPageWidth - 14,
          footerPageHeight - 8,
          { align: "right" },
        );
      }
    }

    doc.save(fileName);
    return;
  }

  const currencyColumnIndexes = getCurrencyColumnIndexes(columns);
  const columnStyles = buildPdfColumnStyles(columns);
  const tableSizing = getPdfTableSizing(columns);

  const body = rows.map((row) =>
    columns.map((column) => formatPdfCellValue(row, column)),
  );

  if (totalsRow) {
    body.push(buildPdfTotalRow(columns, totalsRow));
  }

  if (summaryInfo.length) {
    const summaryY = headerTop + headerHeight + (filterInfo.length ? 21 : 8);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Ringkasan Status", 12, summaryY);

    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.text(formatSummaryInfoText(summaryInfo), 12, summaryY + 6);
  }

  autoTable(doc, {
    head: [columns.map((column) => column.header)],
    body,
    startY:
      headerTop +
      headerHeight +
      (filterInfo.length ? 20 : 8) +
      (summaryInfo.length ? 14 : 0),
    margin: { left: PDF_PAGE_MARGIN, right: PDF_PAGE_MARGIN },
    theme: "grid",
    styles: {
      fontSize: tableSizing.fontSize,
      cellPadding: tableSizing.cellPadding,
      textColor: [31, 41, 55],
      lineColor: [203, 213, 225],
      lineWidth: 0.08,
      valign: "middle",
      overflow: "linebreak",
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
      const isTotalRow = totalsRow && data.row.index === body.length - 1;

      if (data.section === "body" && currencyColumnIndexes.has(data.column.index)) {
        data.cell.styles.halign = "right";
      }

      if (isTotalRow) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.valign = "middle";
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
