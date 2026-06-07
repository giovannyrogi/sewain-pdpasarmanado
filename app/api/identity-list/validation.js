import moment from "moment";
import {
  normalizeRequiredString,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";

const IDENTITY_STATUS = ["active", "inactive", "blacklisted"];
const NATIONALITY_OPTIONS = ["WNI", "WNA"];
const PHONE_PATTERN = /^[0-9]{8,15}$/;
const NIK_PATTERN = /^[0-9]{16}$/;
const SHORT_NUMBER_PATTERN = /^[0-9]{1,3}$/;

const normalizeOptionalString = (value, max = 150) => {
  const normalizedValue = String(value || "").trim();
  return normalizedValue.length > max
    ? { value: normalizedValue, error: `Catatan maksimal ${max} karakter.` }
    : { value: normalizedValue, error: null };
};

const getRequiredFormValue = (formData, key, label, options) =>
  normalizeRequiredString(formData.get(key), label, options);

/**
 * Validasi terpusat untuk payload identitas penyewa.
 * Route create dan update memakai helper ini agar aturan NIK, tanggal lahir,
 * status, dan alamat selalu konsisten walau form UI berubah di kemudian hari.
 */
export const validateIdentityFormData = (formData, { requireFile = false } = {}) => {
  const fields = {};

  const validations = [
    ["nik", getRequiredFormValue(formData, "nomorIndukKependudukan", "NIK", {
      max: 16,
      pattern: NIK_PATTERN,
      patternMessage: "NIK harus berisi 16 digit angka.",
    })],
    ["full_name", getRequiredFormValue(formData, "namaLengkap", "Nama lengkap", { max: 120 })],
    ["birth_place", getRequiredFormValue(formData, "tempatLahir", "Tempat lahir", { max: 80 })],
    ["religion", getRequiredFormValue(formData, "agama", "Agama", { max: 40 })],
    ["occupation", getRequiredFormValue(formData, "pekerjaan", "Pekerjaan", { max: 100 })],
    ["phone", getRequiredFormValue(formData, "phone", "Nomor telepon", {
      max: 15,
      pattern: PHONE_PATTERN,
      patternMessage: "Nomor telepon harus berisi 8 sampai 15 digit angka.",
    })],
    ["street_address", getRequiredFormValue(formData, "alamatJalan", "Nama jalan/alamat", { max: 180 })],
    ["rt", getRequiredFormValue(formData, "rt", "RT", {
      max: 3,
      pattern: SHORT_NUMBER_PATTERN,
      patternMessage: "RT harus berisi 1 sampai 3 digit angka.",
    })],
    ["rw", getRequiredFormValue(formData, "rw", "RW", {
      max: 3,
      pattern: SHORT_NUMBER_PATTERN,
      patternMessage: "RW harus berisi 1 sampai 3 digit angka.",
    })],
    ["province", getRequiredFormValue(formData, "provinsi", "Provinsi", { max: 120 })],
    ["city", getRequiredFormValue(formData, "kabupaten", "Kabupaten/Kota", { max: 120 })],
    ["district", getRequiredFormValue(formData, "kecamatan", "Kecamatan", { max: 120 })],
    ["kelurahan", getRequiredFormValue(formData, "kelurahan", "Kelurahan/Desa", { max: 120 })],
  ];

  for (const [key, result] of validations) {
    if (result.error) {
      return { values: null, error: result.error };
    }
    fields[key] = result.value;
  }

  const birthDate = moment(formData.get("tanggalLahir"));
  if (!birthDate.isValid()) {
    return { values: null, error: "Tanggal lahir tidak valid." };
  }
  fields.birth_date = birthDate.format("YYYY-MM-DD");

  const nationality = String(formData.get("wargaNegara") || "").trim();
  if (!NATIONALITY_OPTIONS.includes(nationality)) {
    return { values: null, error: "Kewarganegaraan tidak valid." };
  }
  fields.nationality = nationality;

  const status = String(formData.get("status") || "").trim();
  if (!IDENTITY_STATUS.includes(status)) {
    return { values: null, error: "Status identitas tidak valid." };
  }
  fields.status = status;

  const notes = normalizeOptionalString(formData.get("notes"), 150);
  if (notes.error) {
    return { values: null, error: notes.error };
  }
  if (status === "blacklisted" && !notes.value) {
    return { values: null, error: "Alasan blacklist wajib diisi." };
  }
  fields.notes = status === "blacklisted" ? notes.value : "";

  const ktpFile = formData.get("ktpFile");
  if (requireFile && (!ktpFile || !ktpFile.name)) {
    return { values: null, error: "Silakan upload foto KTP." };
  }

  return { values: fields, ktpFile, error: null };
};

export const validateIdentityId = (value) =>
  parsePositiveInteger(value, "ID identitas");
