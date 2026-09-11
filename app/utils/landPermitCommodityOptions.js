export const LAND_PERMIT_COMMODITY_OPTIONS = [
  "Booth",
  "Barito",
  "Buah",
  "Cabo",
  "Daging",
  "Ikan Basah",
  "Ikan Kering",
  "Mie Basah",
  "Pakaian Jadi",
  "Sayur",
  "Tahu Tempe",
  "Tenant",
];

export const isValidLandPermitCommodity = (value) =>
  LAND_PERMIT_COMMODITY_OPTIONS.includes(String(value || "").trim());
