export const parseLandPermitNumber = (value) => {
  const normalizedValue = String(value ?? "").replace(",", ".").trim();
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

/**
 * Menghitung luas lahan izin.
 * Rumus ini dipakai untuk preview UI; database tetap menyimpan `stall_area`
 * sebagai generated column agar nilai akhir konsisten di server.
 */
export const calculateLandStallArea = (length = 0, width = 0) =>
  parseLandPermitNumber(length) * parseLandPermitNumber(width);

/**
 * Menghitung estimasi sewa per tahun izin lahan.
 * Modul izin lahan hanya memakai harga per meter, tanpa PPN/PPH/admin fee.
 */
export const calculateAnnualLandRent = ({
  stall_length = 0,
  stall_width = 0,
  price_per_m2 = 0,
} = {}) =>
  calculateLandStallArea(stall_length, stall_width) *
  parseLandPermitNumber(price_per_m2);
