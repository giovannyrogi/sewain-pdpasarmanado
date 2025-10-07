/**
 * Format angka/string ke format mata uang Rupiah, contoh: Rp. 3.000.000
 * @param {number|string} value - Angka atau string yang akan diformat
 * @returns {string} - Hasil format, misal: "Rp. 3.000.000"
 */
function formatRupiah(value, type = "useRp") {
  // Pastikan value berupa angka
  let number = Number(value);
  if (isNaN(number)) return "Rp. 0";

  // Format ke Rupiah dengan pemisah ribuan
  if (type === "hideRp") {
    return number.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  } else {
    return (
      "Rp. " + number.toLocaleString("id-ID", { maximumFractionDigits: 0 })
    );
  }
}

export default formatRupiah;
