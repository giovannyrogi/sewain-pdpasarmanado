/**
 * Hitung nilai kontrak dan PPN berdasarkan jenis pembayaran.
 * @param {"cicilan"|"lunas"} paymentType - Jenis pembayaran
 * @param {number} amount - Total pembayaran (jika cicilan: sudah termasuk PPN)
 * @param {number} [totalPaymentRoom] - Total harga sewa ruangan (untuk lunas)
 * @returns {{
 *   contractAmount: number,
 *   ppnAmount: number,
 *   total: number
 * }}
 */
export function calculateContractAndPPN(paymentType, amount, totalPaymentRoom = 0) {
  const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  if (!amount || isNaN(amount)) {
    return { contractAmount: 0, ppnAmount: 0, total: 0 };
  }

  if (paymentType === "cicilan") {
    // 💰 CICILAN → amount sudah termasuk PPN
    const rawContract = amount / 1.11;
    const contractAmount = round2(rawContract);
    const ppnAmount = round2(rawContract * 0.11);
    const total = round2(contractAmount + ppnAmount);
    return { contractAmount, ppnAmount, total };
  } else if (paymentType === "lunas") {
    // 💰 LUNAS → totalPaymentRoom belum termasuk PPN
    const base = Number(totalPaymentRoom);
    const ppnAmount = round2(base * 0.11);
    const total = round2(base + ppnAmount);
    return { contractAmount: base, ppnAmount, total };
  }

  return { contractAmount: 0, ppnAmount: 0, total: 0 };
}
