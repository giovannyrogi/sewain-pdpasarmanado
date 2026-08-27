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

export const KIP_ANNUAL_ADMIN_FEE = 100000;

export const calculateLandPermitCost = (
  stall = {},
  durationYears = 1,
  administrationType = stall?.administration_type || "kip",
) => {
  const duration = Math.max(1, parseLandPermitNumber(durationYears));
  const type = administrationType === "kkip" ? "kkip" : "kip";
  const area = type === "kip"
    ? calculateLandStallArea(stall.stall_length, stall.stall_width)
    : 0;
  const annualLandRent = type === "kip" ? calculateAnnualLandRent(stall) : 0;
  const adminFee = type === "kip"
    ? KIP_ANNUAL_ADMIN_FEE * duration
    : parseLandPermitNumber(stall.fixed_annual_fee) * duration;
  const totalPaymentLand = annualLandRent * duration;

  return {
    administrationType: type,
    area,
    annualLandRent,
    adminFee,
    totalPaymentLand,
    totalPayment: totalPaymentLand + adminFee,
  };
};
