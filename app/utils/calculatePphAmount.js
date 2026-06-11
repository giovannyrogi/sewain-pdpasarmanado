const PPH_RATE = 0.1;

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

/**
 * Menghitung PPH Pasal 4(2) dari nilai kontrak murni.
 * Nilai kontrak murni adalah nilai sewa sebelum PPN dan iuran administrasi.
 */
export const calculatePphAmount = (contractAmount = 0) => {
  const amount = Number(contractAmount || 0);
  return amount > 0 ? round2(amount * PPH_RATE) : 0;
};

/**
 * Menentukan dasar PPH dari data pembayaran.
 * - Lunas: memakai total sewa ruangan tanpa PPN/admin.
 * - Cicilan: memakai nilai kontrak cicilan, atau fallback amount / 1.11.
 */
export const calculatePaymentPphAmount = ({
  paymentType,
  paymentAmount = 0,
  contractAmount = 0,
  totalPaymentRoom = 0,
} = {}) => {
  const normalizedPaymentType = String(paymentType || "").toLowerCase();

  if (normalizedPaymentType === "lunas") {
    return calculatePphAmount(Number(totalPaymentRoom || contractAmount || 0));
  }

  const baseContractAmount =
    Number(contractAmount || 0) || Number(paymentAmount || 0) / 1.11;
  return calculatePphAmount(baseContractAmount);
};
