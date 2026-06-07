import fs from "fs";
import path from "path";
import moment from "moment";

export const KTP_UPLOAD_DIR = path.join(process.cwd(), "uploads/ktp");
export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
export const MAX_KTP_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_KTP_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
export const ALLOWED_KTP_TYPES = ["image/jpeg", "image/png", "application/pdf"];

if (!fs.existsSync(KTP_UPLOAD_DIR)) {
  fs.mkdirSync(KTP_UPLOAD_DIR, { recursive: true });
}

export const sanitizeFilenamePart = (value) =>
  String(value || "tenant")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "tenant";

/**
 * Membaca file KTP dari FormData dan mengembalikan buffer siap simpan.
 * Validasi ekstensi, MIME, dan ukuran dilakukan di server agar tidak bisa
 * dilewati hanya dengan memodifikasi request dari browser.
 */
export const prepareKtpUpload = async (ktpFile, fullName) => {
  if (!ktpFile || !ktpFile.name) {
    return { ktp_file_path: null, fileBuffer: null, filename: null, error: null };
  }

  if (ktpFile.size > MAX_KTP_FILE_SIZE) {
    return { error: "Ukuran file KTP maksimal 5MB." };
  }

  const ext = path.extname(ktpFile.name).toLowerCase() || ".jpg";
  if (!ALLOWED_KTP_EXTENSIONS.includes(ext) || !ALLOWED_KTP_TYPES.includes(ktpFile.type)) {
    return { error: "Format file KTP harus JPG, PNG, atau PDF." };
  }

  const arrayBuffer = await ktpFile.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const filename = `ktp_${sanitizeFilenamePart(fullName)}_${moment().format(
    "YYYY_MM_DD_HH_mm_ss",
  )}${ext}`;

  return {
    ktp_file_path: `/uploads/ktp/${filename}`,
    fileBuffer,
    filename,
    error: null,
  };
};

export const saveKtpFile = async (filename, fileBuffer) => {
  if (!filename || !fileBuffer) return;
  await fs.promises.writeFile(path.join(KTP_UPLOAD_DIR, filename), fileBuffer);
};

export const removeKtpFile = async (storedPath) => {
  if (!storedPath) return;

  const filePath = path.normalize(path.join(process.cwd(), storedPath.replace(/^\/+/, "")));
  if (filePath.startsWith(UPLOAD_ROOT) && fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};
