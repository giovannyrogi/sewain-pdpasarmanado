import fs from "fs";
import path from "path";
import moment from "moment";

export const KTP_UPLOAD_DIR = path.join(process.cwd(), "uploads/ktp");
export const PROFILE_PHOTO_UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads/pas_foto",
);
export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
export const MAX_KTP_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_KTP_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
export const ALLOWED_KTP_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const ALLOWED_PROFILE_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png"];
export const ALLOWED_PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png"];

if (!fs.existsSync(KTP_UPLOAD_DIR)) {
  fs.mkdirSync(KTP_UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(PROFILE_PHOTO_UPLOAD_DIR)) {
  fs.mkdirSync(PROFILE_PHOTO_UPLOAD_DIR, { recursive: true });
}

export const sanitizeFilenamePart = (value) =>
  String(value || "tenant")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "tenant";

/**
 * Membaca file upload dari FormData dan mengembalikan buffer siap simpan.
 * Validasi ekstensi, MIME, dan ukuran tetap dilakukan server-side agar tidak
 * bisa dilewati hanya dengan memodifikasi request browser.
 */
const prepareIdentityUpload = async ({
  file,
  fullName,
  prefix,
  folder,
  allowedExtensions,
  allowedTypes,
  emptyPathKey,
  errorLabel,
}) => {
  if (!file || !file.name) {
    return { [emptyPathKey]: null, fileBuffer: null, filename: null, error: null };
  }

  if (file.size > MAX_KTP_FILE_SIZE) {
    return { error: `Ukuran file ${errorLabel} maksimal 5MB.` };
  }

  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  if (!allowedExtensions.includes(ext) || !allowedTypes.includes(file.type)) {
    return { error: `Format file ${errorLabel} harus JPG atau PNG.` };
  }

  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const filename = `${prefix}_${sanitizeFilenamePart(fullName)}_${moment().format(
    "YYYY_MM_DD_HH_mm_ss",
  )}${ext}`;

  return {
    [emptyPathKey]: `/uploads/${folder}/${filename}`,
    fileBuffer,
    filename,
    error: null,
  };
};

/**
 * Menyiapkan upload KTP utama identitas. KTP tetap dipakai bersama oleh modul
 * sewa ruangan dan izin lahan, jadi helper lama dipertahankan.
 */
export const prepareKtpUpload = async (ktpFile, fullName) =>
  prepareIdentityUpload({
    file: ktpFile,
    fullName,
    prefix: "ktp",
    folder: "ktp",
    allowedExtensions: ALLOWED_KTP_EXTENSIONS,
    allowedTypes: ALLOWED_KTP_TYPES,
    emptyPathKey: "ktp_file_path",
    errorLabel: "KTP",
  });

/**
 * Menyiapkan upload pas foto khusus kebutuhan dokumen/kartu izin lahan.
 * Path dipisah dari KTP agar arsip upload lebih mudah dikenali.
 */
export const prepareProfilePhotoUpload = async (profilePhotoFile, fullName) =>
  prepareIdentityUpload({
    file: profilePhotoFile,
    fullName,
    prefix: "pas_foto",
    folder: "pas_foto",
    allowedExtensions: ALLOWED_PROFILE_PHOTO_EXTENSIONS,
    allowedTypes: ALLOWED_PROFILE_PHOTO_TYPES,
    emptyPathKey: "profile_photo_file_path",
    errorLabel: "pas foto",
  });

export const saveKtpFile = async (filename, fileBuffer) => {
  if (!filename || !fileBuffer) return;
  await fs.promises.writeFile(path.join(KTP_UPLOAD_DIR, filename), fileBuffer);
};

export const saveProfilePhotoFile = async (filename, fileBuffer) => {
  if (!filename || !fileBuffer) return;
  await fs.promises.writeFile(
    path.join(PROFILE_PHOTO_UPLOAD_DIR, filename),
    fileBuffer,
  );
};

export const removeKtpFile = async (storedPath) => {
  if (!storedPath) return;

  const filePath = path.normalize(path.join(process.cwd(), storedPath.replace(/^\/+/, "")));
  if (filePath.startsWith(UPLOAD_ROOT) && fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};

export const removeProfilePhotoFile = removeKtpFile;
