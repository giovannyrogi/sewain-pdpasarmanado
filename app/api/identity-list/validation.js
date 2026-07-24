import moment from "moment";
import {
  normalizeRequiredString,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";
import { normalizeIndonesianPhone } from "@/app/utils/phoneNumber";

const IDENTITY_STATUS = ["active", "inactive", "blacklisted"];
const LAND_PERMIT_STATUS = ["active", "inactive", "blacklisted"];
const NATIONALITY_OPTIONS = ["WNI", "WNA"];
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

  const phone = normalizeIndonesianPhone(formData.get("phone"));
  if (phone.error) {
    return { values: null, error: phone.error };
  }
  fields.phone = phone.value;

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

/**
 * Validasi status khusus modul izin lahan. Status ini sengaja dipisahkan dari
 * `tenant_identities.status` agar nonaktif/blacklist izin lahan tidak otomatis
 * memblokir proses sewa kontrak ruangan.
 */
export const validateLandPermitIdentityFormData = (
  formData,
  { requireProfilePhoto = false } = {},
) => {
  const landPermitStatus = String(formData.get("landPermitStatus") || "active").trim();
  if (!LAND_PERMIT_STATUS.includes(landPermitStatus)) {
    return { values: null, profilePhotoFile: null, error: "Status izin lahan tidak valid." };
  }

  const landPermitStatusNotes = normalizeOptionalString(
    formData.get("landPermitStatusNotes"),
    150,
  );
  if (landPermitStatusNotes.error) {
    return { values: null, profilePhotoFile: null, error: landPermitStatusNotes.error };
  }

  if (landPermitStatus === "blacklisted" && !landPermitStatusNotes.value) {
    return {
      values: null,
      profilePhotoFile: null,
      error: "Alasan blacklist izin lahan wajib diisi.",
    };
  }

  const profilePhotoFile = formData.get("profilePhotoFile");
  // if (requireProfilePhoto && (!profilePhotoFile || !profilePhotoFile.name)) {
  //   return {
  //     values: null,
  //     profilePhotoFile: null,
  //     error: "Pas foto wajib diupload untuk Admin Izin Lahan.",
  //   };
  // }

  return {
    values: {
      land_permit_status: landPermitStatus,
      land_permit_status_notes:
        landPermitStatus === "blacklisted" ? landPermitStatusNotes.value : "",
    },
    profilePhotoFile,
    error: null,
  };
};

export const validateIdentityId = (value) =>
  parsePositiveInteger(value, "ID identitas");
