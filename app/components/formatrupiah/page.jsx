/**
 * Format angka/string ke format mata uang Rupiah dengan akurasi tinggi.
 * @param {number|string} value - Nilai yang akan diformat.
 * @param {"useRp"|"hideRp"} type - Tipe format: tampilkan "Rp." atau tidak.
 * @returns {string}
 */
function formatRupiah(value, type = "useRp") {
  // Konversi ke angka
  const number = Number(value);
  if (isNaN(number)) return type === "useRp" ? "Rp. 0" : "0";

  // Cek apakah memiliki nilai desimal
  const hasDecimal = !Number.isInteger(number);

  // Format ke string lokal Indonesia
  const formatted = number.toLocaleString("id-ID", {
    minimumFractionDigits: hasDecimal ? 3 : 0,
    maximumFractionDigits: hasDecimal ? 3 : 0,
  });

  return type === "useRp" ? `Rp. ${formatted}` : formatted;
}

export default formatRupiah;
