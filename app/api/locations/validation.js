import { normalizeRequiredString } from "@/app/utils/apiValidation";

const LOCATION_CODE_PATTERN = /^[A-Za-z0-9._\-/\s]+$/;

const LOCATION_FIELDS = [
  ["location_name", "Nama lokasi", { max: 120 }],
  [
    "location_code",
    "Kode lokasi",
    {
      max: 40,
      pattern: LOCATION_CODE_PATTERN,
      patternMessage:
        "Kode lokasi hanya boleh berisi huruf, angka, spasi, titik, garis miring, garis bawah, dan strip.",
    },
  ],
  ["province", "Provinsi", { max: 120 }],
  ["city", "Kabupaten/Kota", { max: 120 }],
  ["district", "Kecamatan", { max: 120 }],
  ["kelurahan", "Kelurahan/Desa", { max: 120 }],
  ["street_address", "Alamat", { max: 255 }],
];

/**
 * Normalisasi dan validasi payload lokasi.
 * Field ditrim sebelum masuk database agar duplikasi karena spasi tersembunyi
 * tidak terjadi dan data master tetap rapi.
 */
export const validateLocationPayload = (body = {}) => {
  const payload = {};

  for (const [key, label, options] of LOCATION_FIELDS) {
    const result = normalizeRequiredString(body[key], label, options);

    if (result.error) {
      return { payload: null, error: result.error };
    }

    payload[key] = result.value;
  }

  return { payload, error: null };
};
