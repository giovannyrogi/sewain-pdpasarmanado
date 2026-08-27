import {
  normalizeOptionalString,
  normalizeRequiredString,
  parsePositiveInteger,
  parsePositiveNumber,
} from "@/app/utils/apiValidation";

export const LAND_STALL_STATUSES = [
  "available",
  "occupied",
  "maintenance",
  "unavailable",
];
export const LAND_STALL_ADMINISTRATION_TYPES = ["kip", "kkip"];

const STALL_NUMBER_PATTERN = /^[A-Za-z0-9._\-/()\s]+$/;

export const validateLandStallPayload = (payload = {}) => {
  const locationId = parsePositiveInteger(payload.location_id, "Lokasi");
  if (locationId.error) return { values: null, error: locationId.error };

  const sectorId = parsePositiveInteger(payload.sector_id, "Sektor");
  if (sectorId.error) return { values: null, error: sectorId.error };

  const stallNumber = normalizeRequiredString(payload.stall_number, "Nomor lahan", {
    max: 50,
    pattern: STALL_NUMBER_PATTERN,
    patternMessage:
      "Nomor lahan hanya boleh berisi huruf, angka, spasi, titik, garis miring, strip, underscore, dan tanda kurung.",
  });
  if (stallNumber.error) return { values: null, error: stallNumber.error };

  const administrationType = String(payload.administration_type || "kip").trim();
  if (!LAND_STALL_ADMINISTRATION_TYPES.includes(administrationType)) {
    return { values: null, error: "Jenis administrasi tidak valid." };
  }

  let stallLength = { value: 0 };
  let stallWidth = { value: 0 };
  let price = { value: 0 };
  let fixedAnnualFee = { value: 0 };

  if (administrationType === "kip") {
    stallLength = parsePositiveNumber(payload.stall_length, "Panjang lahan");
    if (stallLength.error) return { values: null, error: stallLength.error };
    stallWidth = parsePositiveNumber(payload.stall_width, "Lebar lahan");
    if (stallWidth.error) return { values: null, error: stallWidth.error };
    price = parsePositiveNumber(payload.price_per_m2, "Harga per m²");
    if (price.error) return { values: null, error: price.error };
  } else {
    fixedAnnualFee = parsePositiveNumber(
      payload.fixed_annual_fee,
      "Tarif tetap KKIP per tahun",
    );
    if (fixedAnnualFee.error) return { values: null, error: fixedAnnualFee.error };
  }

  const status = String(payload.status || "available").trim();
  if (!LAND_STALL_STATUSES.includes(status)) {
    return { values: null, error: "Status lahan tidak valid." };
  }

  const notes = normalizeOptionalString(payload.notes, "Catatan", 180);
  if (notes.error) return { values: null, error: notes.error };

  if (["maintenance", "unavailable"].includes(status) && !notes.value) {
    return {
      values: null,
      error: "Catatan wajib diisi untuk lahan dalam perbaikan atau tidak layak.",
    };
  }

  return {
    values: {
      location_id: locationId.value,
      sector_id: sectorId.value,
      stall_number: stallNumber.value,
      stall_length: Number(stallLength.value.toFixed(4)),
      stall_width: Number(stallWidth.value.toFixed(4)),
      price_per_m2: Number(price.value.toFixed(2)),
      administration_type: administrationType,
      fixed_annual_fee: Number(fixedAnnualFee.value.toFixed(2)),
      status,
      notes: notes.value,
    },
    error: null,
  };
};

export const validateLandStallId = (value) =>
  parsePositiveInteger(value, "ID lahan");
