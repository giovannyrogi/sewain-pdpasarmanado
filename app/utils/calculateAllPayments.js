export const calculateAllPayments = ({
  room,
  paymentType,
  downPayment,
  chooseTenor,
  adminFee = 0,
}) => {
  const TAX = 0.11;

  const price = Number(room?.price_per_m2 || 0);
  const area = Number(room?.room_length || 0) * Number(room?.room_width || 0);

  const totalSewa =
    room?.price_type === "harga_per_meter" ? area * price : price;

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
    totalSewa,
    totalPPN,
    totalPayment,
    remaining,
    installments,
  };
};
