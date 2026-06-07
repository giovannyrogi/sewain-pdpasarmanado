import { calculateRoomRent } from "./calculateRoomRent";

export const buildPaymentDetail = (data) => {
  if (!data) {
    return {
      totalPayment: 0,
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
  const totalPayment = Number(data?.total_payment || 0);
  const downPayment = Number(data?.down_payment || 0);
  const remainingPayment = Number(data?.remaining_payment || 0);

  // =========================
  //  TOTAL SEWA
  // =========================
  const totalSewaKontrakRuangan = calculateRoomRent(data);

  // =========================
  //  PPN
  // =========================
  const totalPPN = Number(data?.total_ppn);

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
    totalSewaKontrakRuangan,
    PPNDownPayment,
    nilaiKontrak,
    totalPPN,
    totalInstallment,
    remainingPayment,
    downPayment,
  };
};
