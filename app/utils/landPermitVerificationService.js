import "server-only";
import fs from "fs";
import path from "path";
import moment from "moment";
import pool from "@/lib/dbConfig";
import { administrationLabel, formatTraderAddress, formatLandDocumentNumber } from "@/app/utils/traderCardPrinting";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,120}$/;
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const PUBLIC_PHOTO_CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export const isValidLandPermitQrToken = (token) =>
  typeof token === "string" && TOKEN_PATTERN.test(token);

const maskNik = (value) => {
  const nik = String(value || "").replace(/\D/g, "");
  if (!nik) return "-";

  const visibleStart = 4;
  const visibleEnd = 5;

  if (nik.length <= visibleStart + visibleEnd) return nik;

  const maskedLength = nik.length - visibleStart - visibleEnd;

  return `${nik.slice(0, visibleStart)}${"*".repeat(maskedLength)}${nik.slice(-visibleEnd)}`;
};

const toIsoDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("YYYY-MM-DD") : null;

const getPublicProfilePhotoDataUrl = async (filePath) => {
  if (!filePath || typeof filePath !== "string") return "";

  const normalizedPath = filePath
    .replace(/^(\/api)+(?=\/uploads\/)/, "")
    .replace(/^\/uploads\//, "");
  const safePath = path.normalize(path.join(UPLOAD_DIR, normalizedPath));

  if (!safePath.startsWith(UPLOAD_DIR)) return "";

  const extension = path.extname(safePath).toLowerCase();
  const contentType = PUBLIC_PHOTO_CONTENT_TYPES[extension];

  if (!contentType || !fs.existsSync(safePath)) return "";

  const fileBuffer = await fs.promises.readFile(safePath);
  return `data:${contentType};base64,${fileBuffer.toString("base64")}`;
};

const buildStatus = (row) => {
  const today = moment().startOf("day");
  const startDate = row.start_date
    ? moment(row.start_date).startOf("day")
    : null;
  const endDate = row.end_date ? moment(row.end_date).startOf("day") : null;
  const landPermitStatus = String(row.land_permit_status || "").toLowerCase();

  if (row.document_status === "void") {
    return {
      code: "inactive",
      label: "Izin Dinonaktifkan",
      tone: "error",
      reason: "Dokumen izin lahan ini sudah dibatalkan.",
    };
  }

  if (!["active", "printed"].includes(row.document_status)) {
    return {
      code: "inactive",
      label: "Izin Belum Aktif",
      tone: "error",
      reason: "Dokumen izin lahan ini belum bisa dipakai untuk pengecekan.",
    };
  }

  if (row.permit_status === "terminated") {
    return {
      code: "terminated",
      label: "Izin Dinonaktifkan",
      tone: "error",
      reason: row.termination_reason || "Izin lahan ini sudah dinonaktifkan.",
      terminated_at: toIsoDate(row.terminated_at),
    };
  }

  if (landPermitStatus && landPermitStatus !== "active") {
    return {
      code: landPermitStatus === "blacklisted" ? "blacklisted" : "inactive",
      label:
        landPermitStatus === "blacklisted"
          ? "Pedagang Diblokir"
          : "Pedagang Nonaktif",
      tone: "error",
      reason:
        row.land_permit_status_notes ||
        "Status pedagang untuk izin lahan sedang tidak aktif.",
    };
  }

  if (startDate?.isValid() && today.isBefore(startDate)) {
    return {
      code: "not_started",
      label: "Belum Mulai",
      tone: "warning",
      reason:
        "Izin lahan ini sudah terdaftar, tetapi tanggal berlakunya belum mulai.",
    };
  }

  if (endDate?.isValid() && today.isAfter(endDate)) {
    return {
      code: "expired",
      label: "Masa Izin Habis",
      tone: "warning",
      reason: "Masa berlaku izin lahan ini sudah habis.",
    };
  }

  if (
    row.application_approval_status !== "approved" ||
    row.payment_status !== "paid" ||
    row.is_fully_paid !== true
  ) {
    return {
      code: "inactive",
      label: "Izin Belum Aktif",
      tone: "error",
      reason: "Data izin lahan ini belum lengkap untuk dinyatakan aktif.",
    };
  }

  return {
    code: "valid",
    label: "Izin Aktif",
    tone: "success",
    reason: "Izin lahan ini terdaftar di sistem dan masih berlaku.",
  };
};

export const getLandPermitVerificationByToken = async (token) => {
  if (!isValidLandPermitQrToken(token)) {
    return null;
  }

  const result = await pool.query(
    `
    SELECT
      document.document_number,
      document.status AS document_status,
      document.created_at AS document_created_at,
      document.printed_at,
      app.commodity_type,
      app.administration_type,
      app.start_date,
      app.end_date,
      app.approval_status AS application_approval_status,
      app.payment_status,
      app.is_fully_paid,
      app.permit_status,
      identity.full_name AS tenant_name,
      identity.nik AS tenant_nik,
      identity.street_address, identity.rt, identity.rw, identity.kelurahan,
      identity.district, identity.city, identity.province,
      identity.profile_photo_file_path,
      identity.land_permit_status,
      identity.land_permit_status_notes,
      location.location_name,
      sector.sector_name,
      sector.sector_code,
      stall.stall_number,
      stall.stall_length,
      stall.stall_width,
      stall.stall_area,
      termination.reason AS termination_reason,
      termination.terminated_at
    FROM land_permit_documents document
    JOIN land_permit_applications app
      ON app.id = document.land_permit_application_id
    JOIN tenant_identities identity
      ON identity.id = app.tenant_identity_id
    JOIN locations location
      ON location.id = app.location_id
    LEFT JOIN land_sectors sector
      ON sector.id = app.sector_id
    LEFT JOIN land_stalls stall
      ON stall.id = app.stall_id
    LEFT JOIN LATERAL (
      SELECT
        term.reason,
        term.terminated_at
      FROM land_permit_terminations term
      WHERE term.land_permit_application_id = app.id
        AND term.approval_status = 'approved'
        AND term.is_terminated = TRUE
      ORDER BY term.terminated_at DESC NULLS LAST, term.id DESC
      LIMIT 1
    ) termination ON TRUE
    WHERE document.document_type = 'permit_document'
      AND document.qr_token = $1
    LIMIT 1
    `,
    [token],
  );

  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  const status = buildStatus(row);
  const profilePhotoDataUrl = await getPublicProfilePhotoDataUrl(
    row.profile_photo_file_path,
  );

  return {
    status,
    document_number: formatLandDocumentNumber(row.document_number, row.administration_type),
    document_status: row.document_status || "-",
    document_created_at: toIsoDate(row.document_created_at),
    printed_at: toIsoDate(row.printed_at),
    tenant_name: row.tenant_name || "-",
    administration_type: row.administration_type || "",
    // Address is explicitly part of the public verification details requested by the owner.
    tenant_address: formatTraderAddress(row) || "-",
    tenant_nik_masked: maskNik(row.tenant_nik),
    profile_photo_data_url: profilePhotoDataUrl,
    location_name: row.location_name || "-",
    sector_name: row.sector_name || "-",
    sector_code: row.sector_code || "",
    ...(administrationLabel(row.administration_type) === "KIP" ? {
      stall_number: row.stall_number || "-",
      stall_length: row.stall_length,
      stall_width: row.stall_width,
      stall_area: row.stall_area,
    } : {}),
    commodity_type: row.commodity_type || "-",
    start_date: toIsoDate(row.start_date),
    end_date: toIsoDate(row.end_date),
    land_permit_status: row.land_permit_status || "-",
  };
};
