import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { removeKtpFile } from "../fileHelpers";
import { validateIdentityId } from "../validation";

const MASTER_DATA_ROLES = [1, 2, 9];

const mapIdentityRow = (row) => ({
  id: row.id,
  user_id: row.user_id,
  nik: row.nik,
  full_name: row.full_name,
  ktp_file_path: row.ktp_file_path,
  birth_place: row.birth_place,
  birth_date: row.birth_date,
  nationality: row.nationality,
  religion: row.religion,
  occupation: row.occupation,
  status: row.status,
  notes: row.notes,
  street_address: row.street_address,
  rt: row.rt,
  rw: row.rw,
  kelurahan: row.kelurahan,
  district: row.district,
  city: row.city,
  province: row.province,
  postal_code: row.postal_code,
  phone: row.phone,
  updated_at: row.updated_at
    ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
  created_at: row.created_at
    ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
});

export async function GET(request, { params }) {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    const { id: rawId } = await params;
    const { value: id, error } = validateIdentityId(rawId);
    if (error) {
      return failResponse(error, 400);
    }

    const result = await pool.query(
      "SELECT * FROM tenant_identities WHERE id = $1 LIMIT 1",
      [id],
    );

    if (result.rowCount === 0) {
      return failResponse("Data identitas tidak ditemukan.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data identitas penyewa.",
      data: [mapIdentityRow(result.rows[0])],
    });
  } catch (error) {
    return handleApiError(
      "Error fetching identity detail",
      error,
      "Terjadi kesalahan saat mengambil detail identitas.",
    );
  }
}

export async function DELETE(request, { params }) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const { value: id, error } = validateIdentityId(rawId);
    if (error) {
      return failResponse(error, 400);
    }

    const today = moment().format("YYYY-MM-DD");

    const identityResult = await client.query(
      "SELECT ktp_file_path, full_name FROM tenant_identities WHERE id = $1 LIMIT 1",
      [id],
    );

    if (identityResult.rowCount === 0) {
      return failResponse("Data identitas tidak ditemukan.", 404);
    }

    const activeApplicationResult = await client.query(
      `
      SELECT 
        ta.id,
        ta.approval_status,
        ta.end_date,
        l.location_name,
        r.room_number
      FROM tenant_application ta
      LEFT JOIN locations l ON ta.location_id = l.id
      LEFT JOIN rooms r ON ta.room_id = r.id
      WHERE ta.tenant_identity_id = $1
      ORDER BY ta.created_at DESC
      LIMIT 1
      `,
      [id],
    );

    if (activeApplicationResult.rowCount > 0) {
      const application = activeApplicationResult.rows[0];

      if (application.approval_status === "proses") {
        return failResponse(
          "Identitas masih digunakan pada permohonan sewa yang sedang proses approval.",
          409,
        );
      }

      if (application.approval_status === "approved") {
        const endDate = application.end_date
          ? moment(application.end_date).format("YYYY-MM-DD")
          : null;

        if (endDate && moment(endDate).isSameOrAfter(today)) {
          return failResponse(
            `Identitas masih aktif pada ${application.location_name || "lokasi terkait"} ruangan ${application.room_number || "-"}.`,
            409,
          );
        }
      }
    }

    const activeLandPermitResult = await client.query(
      `
      SELECT 
        lpa.id,
        lpa.approval_status,
        lpa.permit_status,
        l.location_name,
        ls.sector_name,
        lst.stall_number
      FROM land_permit_applications lpa
      LEFT JOIN locations l ON lpa.location_id = l.id
      LEFT JOIN land_sectors ls ON lpa.sector_id = ls.id
      LEFT JOIN land_stalls lst ON lpa.stall_id = lst.id
      WHERE lpa.tenant_identity_id = $1
      ORDER BY lpa.created_at DESC
      LIMIT 1
      `,
      [id],
    );

    if (activeLandPermitResult.rowCount > 0) {
      const landPermit = activeLandPermitResult.rows[0];

      if (landPermit.approval_status === "proses") {
        return failResponse(
          "Identitas masih digunakan pada permohonan izin lahan yang sedang proses approval.",
          409,
        );
      }

      if (landPermit.permit_status === "active") {
        return failResponse(
          `Identitas masih aktif pada izin lahan ${landPermit.location_name || "lokasi terkait"} sektor ${landPermit.sector_name || "-"} lapak ${landPermit.stall_number || "-"}.`,
          409,
        );
      }
    }

    await client.query("DELETE FROM tenant_identities WHERE id = $1", [id]);
    await removeKtpFile(identityResult.rows[0]?.ktp_file_path).catch((fileError) =>
      console.warn("Gagal menghapus file KTP:", fileError),
    );

    return jsonResponse({
      success: true,
      message: "Data identitas berhasil dihapus.",
    });
  } catch (error) {
    return handleApiError(
      "Error deleting identity",
      error,
      "Terjadi kesalahan saat menghapus data identitas.",
    );
  } finally {
    client.release();
  }
}
