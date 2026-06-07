import {
  normalizeRequiredString,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";

export const FLOOR_OPTIONS = [
  "Basement",
  ...Array.from({ length: 10 }, (_, index) => `Lt. ${index + 1}`),
];

/**
 * Validasi payload lantai.
 * location_id harus ID valid dan floor harus berasal dari opsi resmi agar data
 * master tetap konsisten dengan pilihan yang tersedia di form.
 */
export const validateFloorPayload = (body = {}) => {
  const locationId = parsePositiveInteger(body.location_id, "Lokasi");

  if (locationId.error) {
    return { payload: null, error: locationId.error };
  }

  const floor = normalizeRequiredString(body.floor, "Lantai", { max: 30 });

  if (floor.error) {
    return { payload: null, error: floor.error };
  }

  if (!FLOOR_OPTIONS.includes(floor.value)) {
    return {
      payload: null,
      error: "Lantai yang dipilih tidak valid.",
    };
  }

  return {
    payload: {
      location_id: locationId.value,
      floor: floor.value,
    },
    error: null,
  };
};
