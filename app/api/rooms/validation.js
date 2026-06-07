import {
  normalizeRequiredString,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";

export const ROOM_STATUSES = ["available", "occupied", "maintenance", "unavailable"];
export const ROOM_PRICE_TYPES = ["harga_per_meter", "harga_tetap"];

const ROOM_NUMBER_PATTERN = /^[A-Za-z0-9._\-/()\s]+$/;

const parseNonNegativeNumber = (value, label) => {
  const normalizedValue = String(value ?? "").replace(",", ".").trim();
  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return { value: null, error: `${label} harus berupa angka 0 atau lebih.` };
  }

  return { value: parsedValue, error: null };
};

const parsePositiveNumber = (value, label) => {
  const result = parseNonNegativeNumber(value, label);
  if (result.error) return result;

  if (result.value <= 0) {
    return { value: null, error: `${label} harus lebih besar dari 0.` };
  }

  return result;
};

/**
 * Validasi payload rooms dipusatkan di sini agar create dan update memakai
 * aturan yang sama: relasi lokasi/lantai valid, angka positif, status terkontrol,
 * dan catatan wajib untuk status yang tidak siap digunakan.
 */
export const validateRoomPayload = (payload = {}) => {
  const locationId = parsePositiveInteger(payload.location_id, "Lokasi");
  if (locationId.error) return { values: null, error: locationId.error };

  const floorId = parsePositiveInteger(payload.floor_id, "Lantai");
  if (floorId.error) return { values: null, error: floorId.error };

  const roomNumber = normalizeRequiredString(payload.room_number, "Nomor ruangan", {
    max: 50,
    pattern: ROOM_NUMBER_PATTERN,
    patternMessage:
      "Nomor ruangan hanya boleh berisi huruf, angka, spasi, titik, garis miring, strip, underscore, dan tanda kurung.",
  });
  if (roomNumber.error) return { values: null, error: roomNumber.error };

  const status = String(payload.status || "").trim();
  if (!ROOM_STATUSES.includes(status)) {
    return { values: null, error: "Status ruangan tidak valid." };
  }

  const priceType = String(payload.price_type || "").trim();
  if (!ROOM_PRICE_TYPES.includes(priceType)) {
    return { values: null, error: "Jenis harga ruangan tidak valid." };
  }

  const price = parseNonNegativeNumber(payload.price_per_m2, "Harga sewa");
  if (price.error) return { values: null, error: price.error };

  const notes = String(payload.notes || "").trim();
  if (notes.length > 150) {
    return { values: null, error: "Catatan maksimal 150 karakter." };
  }

  if (["maintenance", "unavailable"].includes(status) && !notes) {
    return {
      values: null,
      error: "Catatan wajib diisi untuk ruangan dalam perbaikan atau tidak layak.",
    };
  }

  const roomArea = parsePositiveNumber(payload.room_area, "Luas ruangan");
  if (roomArea.error) return { values: null, error: roomArea.error };

  let roomLength = { value: 0 };
  let roomWidth = { value: 0 };

  if (priceType === "harga_per_meter") {
    roomLength = parsePositiveNumber(payload.room_length, "Panjang ruangan");
    if (roomLength.error) return { values: null, error: roomLength.error };

    roomWidth = parsePositiveNumber(payload.room_width, "Lebar ruangan");
    if (roomWidth.error) return { values: null, error: roomWidth.error };
  }

  return {
    values: {
      location_id: locationId.value,
      floor_id: floorId.value,
      room_number: roomNumber.value,
      room_length: roomLength.value,
      room_width: roomWidth.value,
      room_area: roomArea.value,
      status,
      price_per_m2: price.value,
      notes: notes || null,
      price_type: priceType,
    },
    error: null,
  };
};

export const validateRoomId = (value) => parsePositiveInteger(value, "ID ruangan");
