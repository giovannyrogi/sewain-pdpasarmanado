/**
 * Format angka/string ke format mata uang Rupiah.
 * - Otomatis menghapus trailing zero pada desimal
 * - Tetap mempertahankan angka desimal penting
 *
 * Contoh:
 * 8066919.500 -> 8.066.919,5
 * 8066919.250 -> 8.066.919,25
 * 8066919.000 -> 8.066.919
 *
 * @param {number|string} value
 * @param {"useRp"|"hideRp"} type
 * @returns {string}
 */
function formatRupiah(value, type = "useRp") {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === "") {
    return type === "useRp" ? "Rp. 0" : "0";
  }

  // Konversi ke number
  const number = Number(value);

  // Validasi NaN
  if (isNaN(number)) {
    return type === "useRp" ? "Rp. 0" : "0";
  }

  // Format angka Indonesia
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(number);

  return type === "useRp" ? `Rp. ${formatted}` : formatted;
}

export default formatRupiah;