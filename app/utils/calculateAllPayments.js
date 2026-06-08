import {
  calculateAnnualRoomRent,
  calculateContractRoomRent,
  normalizeLeaseDurationYears,
} from "./calculateRoomRent";

export const calculateAllPayments = ({
  room,
  leaseDurationYears = 1,
  paymentType,
  downPayment,
  chooseTenor,
  adminFee = 0,
}) => {
  const TAX = 0.11;
  const durationYears = normalizeLeaseDurationYears(leaseDurationYears);

  const annualRoomRent = calculateAnnualRoomRent(room);
  const totalSewa = calculateContractRoomRent(room, durationYears);
  const totalPPN = totalSewa * TAX;
  const totalPayment = totalSewa + totalPPN + adminFee;

  let remaining = 0;
  let installments = [];

  if (paymentType === "cicilan") {
    const dp = Number(downPayment || 0);
    remaining = totalPayment - dp;

    const tenor = Number(chooseTenor || 1);

    if (tenor > 0) {
      const per = Math.floor(remaining / tenor);
      const sisa = remaining - per * tenor;

      installments = Array(tenor).fill(per);
      installments[tenor - 1] += sisa;
    }
  }

  return {
    annualRoomRent,
    leaseDurationYears: durationYears,
    totalSewa,
    totalPPN,
    totalPayment,
    remaining,
    installments,
  };
};
