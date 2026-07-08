const PPH_RATE = 0.1;

const readNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const roundCurrency = (value = 0) => {
  const numberValue = readNumber(value);
  const rounded = Math.round(numberValue + Number.EPSILON);
  return Object.is(rounded, -0) ? 0 : rounded;
};

export const hasReconciliationOtherAmount = (value = 0) =>
  roundCurrency(value) !== 0;

/**
 * Membulatkan komponen rekon pembayaran tanpa mengubah nilai database.
 * Selisih "Lainnya" hanya dipakai untuk cicilan karena pembagian kontrak/PPN
 * dapat menghasilkan angka desimal.
 */
export const buildReconciledPaymentBreakdown = ({
  paymentType,
  paymentAmount,
  amount,
  contractAmount,
  ppnAmount,
  jtuAmount = 0,
} = {}) => {
  const normalizedPaymentType = String(paymentType || "").toLowerCase();
  const isInstallment = normalizedPaymentType === "cicilan";
  const roundedPaymentAmount = roundCurrency(
    paymentAmount !== undefined ? paymentAmount : amount,
  );
  const roundedContract = roundCurrency(contractAmount);
  const roundedJtu = roundCurrency(jtuAmount);
  const roundedPpn = roundCurrency(ppnAmount);
  const baseTotal = roundedContract + roundedJtu + roundedPpn;
  const otherAmount = isInstallment
    ? roundCurrency(roundedPaymentAmount - baseTotal)
    : 0;
  const totalPlusPpn = isInstallment
    ? baseTotal + otherAmount
    : baseTotal;
  const totalPph = roundCurrency(roundedContract * PPH_RATE);

  return {
    paymentAmount: isInstallment ? roundedPaymentAmount : totalPlusPpn,
    contractAmount: roundedContract,
    jtuAmount: roundedJtu,
    ppnAmount: roundedPpn,
    otherAmount,
    totalPlusPpn,
    totalPph,
    totalNet: roundedContract + roundedJtu + otherAmount - totalPph,
  };
};
