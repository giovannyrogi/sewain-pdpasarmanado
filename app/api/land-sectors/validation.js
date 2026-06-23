import {
  normalizeOptionalString,
  normalizeRequiredString,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";

export const LAND_SECTOR_STATUSES = ["active", "inactive"];

const SECTOR_CODE_PATTERN = /^[A-Za-z0-9._\-/\s]+$/;

export const validateLandSectorPayload = (payload = {}) => {
  const locationId = parsePositiveInteger(payload.location_id, "Lokasi");
  if (locationId.error) return { values: null, error: locationId.error };

  const sectorName = normalizeRequiredString(payload.sector_name, "Nama sektor", {
    max: 120,
  });
  if (sectorName.error) return { values: null, error: sectorName.error };

  const sectorCode = normalizeOptionalString(payload.sector_code, "Kode sektor", 50);
  if (sectorCode.error) return { values: null, error: sectorCode.error };

  if (sectorCode.value && !SECTOR_CODE_PATTERN.test(sectorCode.value)) {
    return {
      values: null,
      error:
        "Kode sektor hanya boleh berisi huruf, angka, spasi, titik, garis miring, strip, dan underscore.",
    };
  }

  const description = normalizeOptionalString(payload.description, "Deskripsi", 220);
  if (description.error) return { values: null, error: description.error };

  const status = String(payload.status || "active").trim();
  if (!LAND_SECTOR_STATUSES.includes(status)) {
    return { values: null, error: "Status sektor tidak valid." };
  }

  return {
    values: {
      location_id: locationId.value,
      sector_name: sectorName.value,
      sector_code: sectorCode.value,
      description: description.value,
      status,
    },
    error: null,
  };
};

export const validateLandSectorId = (value) =>
  parsePositiveInteger(value, "ID sektor");
