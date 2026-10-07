export const LAND_PERMIT_COMMODITY_OPTIONS = [
  "Booth",
  "Barito",
  "Buah",
  "Cabo",
  "Campuran",
  "Daging",
  "Ikan Basah",
  "Ikan Kering",
  "Mie Basah",
  "Pakaian Jadi",
  "Sayur",
  "Sembako",
  "Tahu Tempe",
  "Tenant",
];

export const isValidLandPermitCommodity = (value) =>
  LAND_PERMIT_COMMODITY_OPTIONS.includes(String(value || "").trim());
