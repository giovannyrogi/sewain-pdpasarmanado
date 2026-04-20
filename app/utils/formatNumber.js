export const formatNumber = (
  value,
  {
    defaultValue = "0",
    useGrouping = false, // ribuan (1,000)
    maxFractionDigits = 10, // biar tidak kepotong
  } = {}
) => {
  try {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }

    const number = Number(value);

    if (isNaN(number)) {
      return defaultValue;
    }

    // pakai Intl biar fleksibel & aman
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
      useGrouping,
    }).format(number);
  } catch (err) {
    return defaultValue;
  }
};