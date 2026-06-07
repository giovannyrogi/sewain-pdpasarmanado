import moment from "moment";
import XLSX from "xlsx-js-style";
import formatRupiah from "@/app/components/formatrupiah/page";

/**
 * Membuat file Excel untuk daftar tenant application.
 * Dipisah dari page agar halaman fokus ke state dan interaksi UI, sementara
 * format laporan bisa dirawat tanpa menyentuh komponen layar utama.
 */
export function exportTenantApplicationsToExcel(data) {
  const grandTotal = data.reduce((acc, item) => acc + Number(item.total_payment), 0);

  const exportData = data.map((item) => ({
    "Nama Penyewa": item?.location_name ? item?.location_name : "-",
    "Nomor Dokumen": item?.document_number ? item?.document_number : "-",
    "Nomor Ruangan": item?.room_number ? item?.room_number : "-",
    Lantai: item?.floor ? item?.floor : "-",
    "Masa Berlaku":
      item?.start_date && item?.end_date
        ? `${moment(item?.start_date).format("Do MMM YYYY")} s/d ${moment(item?.end_date).format("Do MMM YYYY")}`
        : "-",
    "Status Persetujuan":
      item?.approval_status === "proses"
        ? "Dalam Proses"
        : item?.approval_status === "approved"
          ? "Disetujui"
          : item?.approval_status === "rejected"
            ? "Ditolak"
            : "-",
    "Jenis Pembayaran":
      item?.payment_type === "cicilan"
        ? "Cicilan"
        : item?.payment_type === "lunas"
          ? "Lunas"
          : "-",
    "Uang Muka": item?.down_payment ? formatRupiah(item?.down_payment) : "-",
    "Sisa Pembayaran": item?.remaining_payment
      ? formatRupiah(item?.remaining_payment)
      : "-",
    "Total Pembayaran": item?.total_payment ? formatRupiah(item?.total_payment) : "-",
  }));

  exportData.push({
    "Nama Penyewa": "Grant Total",
    "Nomor Dokumen": "",
    "Nomor Ruangan": "",
    Lantai: "",
    "Masa Berlaku": "",
    "Status Persetujuan": "",
    "Jenis Pembayaran": "",
    "Uang Muka": "",
    "Sisa Pembayaran": "",
    "Total Pembayaran": grandTotal ? formatRupiah(grandTotal) : "-",
  });

  const ws = XLSX.utils.json_to_sheet(exportData, { origin: "A3" });
  XLSX.utils.sheet_add_aoa(ws, [["Data Pemohon Sewa Kontrak Ruangan"]], {
    origin: "A1",
  });

  ws["!cols"] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 25 },
  ];

  const totalRows = exportData.length + 3;
  ws["!rows"] = Array.from({ length: totalRows }, (_, index) => ({
    hpt: index === 0 ? 30 : index === 2 ? 22 : 18,
  }));

  const titleCell = ws["A1"];
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2F75B5" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  }

  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

  const headerRowIndex = 2;
  const headerCols = Object.keys(exportData[0]).length;
  for (let columnIndex = 0; columnIndex < headerCols; columnIndex += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: columnIndex });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  }

  const totalRowIndex = exportData.length + 2;
  for (let columnIndex = 0; columnIndex < headerCols; columnIndex += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: columnIndex });
    if (!ws[cellAddress]) continue;

    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E2EFDA" } },
      alignment: {
        horizontal: columnIndex === 0 ? "left" : "right",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  }

  const centerColumns = [1, 2, 3, 4, 5, 6];
  const rightColumns = [7, 8, 9];

  for (let rowIndex = 3; rowIndex <= totalRowIndex - 1; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < headerCols; columnIndex += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      if (!ws[cellAddress]) continue;

      let horizontal = "left";
      if (centerColumns.includes(columnIndex)) horizontal = "center";
      if (rightColumns.includes(columnIndex)) horizontal = "right";

      ws[cellAddress].s = {
        alignment: { horizontal, vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Lokasi");
  XLSX.writeFile(wb, `Data_Pemohon_${moment().format("YYYY-MM-DD")}.xlsx`);
}
