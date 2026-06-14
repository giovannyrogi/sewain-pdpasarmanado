import {
  calculateAnnualRoomRent,
  calculateContractRoomRent,
  normalizeLeaseDurationYears,
} from "./calculateRoomRent";

/**
 * Membaca nilai snapshot biaya dari database tanpa menganggap angka 0 sebagai
 * data kosong. Perhitungan ulang hanya dipakai untuk data lama/API yang belum
 * mengirim nilai, bukan untuk menutupi data database yang sudah valid.
 */
const readSnapshotNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const buildPaymentDetail = (data) => {
  if (!data) {
    return {
      totalPayment: 0,
      annualRoomRent: 0,
      leaseDurationYears: 1,
      totalSewaKontrakRuangan: 0,
      PPNDownPayment: 0,
      nilaiKontrak: 0,
      totalPPN: 0,
      totalInstallment: 0,
      remainingPayment: 0,
      downPayment: 0,
    };
  }

  const TAX = 0.11;

  // =========================
  //  BASE (AMBIL BACKEND)
  // =========================
  const totalPayment = readSnapshotNumber(data?.total_payment);
  const downPayment = readSnapshotNumber(data?.down_payment);
  const remainingPayment = readSnapshotNumber(data?.remaining_payment);
  const leaseDurationYears = normalizeLeaseDurationYears(
    data?.lease_duration_years,
  );

  // =========================
  //  TOTAL SEWA
  // =========================
  const annualRoomRent = readSnapshotNumber(
    data?.annual_room_rent,
    calculateAnnualRoomRent(data),
  );
  const totalSewaKontrakRuangan = readSnapshotNumber(
    data?.total_payment_room,
    calculateContractRoomRent(data, leaseDurationYears),
  );

  // =========================
  //  PPN
  // =========================
  const totalPPN = readSnapshotNumber(
    data?.total_ppn,
    totalSewaKontrakRuangan * TAX,
  );

  // =========================
  //  DP BREAKDOWN
  // =========================
  const nilaiKontrak = downPayment / (1 + TAX);
  const PPNDownPayment = nilaiKontrak * TAX;

  // =========================
  //  INSTALLMENTS
  // =========================
  const installmentKeys = [
    "estimated_installment_1",
    "estimated_installment_2",
    "estimated_installment_3",
  ];

  const totalInstallment = installmentKeys.reduce((total, key) => {
    return total + Number(data?.[key] || 0);
  }, 0);

  // =========================
  //  RETURN FINAL OBJECT
  // =========================
  return {
    totalPayment,
    annualRoomRent,
    leaseDurationYears,
    totalSewaKontrakRuangan,
    PPNDownPayment,
    nilaiKontrak,
    totalPPN,
    totalInstallment,
    remainingPayment,
    downPayment,
  };
};
