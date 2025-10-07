/**
 * Format angka/string ke format mata uang Rupiah dengan akurasi tinggi.
 * @param {number|string} value - Nilai yang akan diformat.
 * @param {"useRp"|"hideRp"} type - Tipe format: tampilkan "Rp." atau tidak.
 * @returns {string}
 */
function formatRupiah(value, type = "useRp") {
  // Konversi ke angka
  let number = Number(value);
  if (isNaN(number)) return type === "useRp" ? "Rp. 0" : "0";

  // Pastikan angka dibulatkan ke bawah agar tidak naik 1 digit akibat floating point
  number = Math.floor(number);

  // Format ke string lokal Indonesia
  const formatted = number.toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  });

  return type === "useRp" ? `Rp. ${formatted}` : formatted;
}

export default formatRupiah;
