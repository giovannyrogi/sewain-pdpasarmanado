import pool from "@/lib/dbConfig";
import { normalizeStoredUploadPath } from "@/app/utils/uploadPath";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { prepareKtpUpload, removeKtpFile, saveKtpFile } from "../fileHelpers";
import { validateIdentityFormData, validateIdentityId } from "../validation";

const MASTER_DATA_ROLES = [1, 2, 9];

export async function PUT(req) {
  let uploadedPath = null;

  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const formData = await req.formData();
    const { value: id, error: idError } = validateIdentityId(formData.get("id"));
    if (idError) {
      return failResponse(idError, 400);
    }

    const { values, ktpFile, error } = validateIdentityFormData(formData);
    if (error) {
      return failResponse(error, 400);
    }

    const existingData = await pool.query(
      "SELECT ktp_file_path FROM tenant_identities WHERE id = $1 LIMIT 1",
      [id],
    );

    if (existingData.rowCount === 0) {
      return failResponse("Data identitas tidak ditemukan.", 404);
    }

    const duplicateNik = await pool.query(
      "SELECT 1 FROM tenant_identities WHERE nik = $1 AND id <> $2 LIMIT 1",
      [values.nik, id],
    );

    if (duplicateNik.rowCount > 0) {
      return failResponse("NIK sudah terdaftar.", 409);
    }

    const preparedFile = await prepareKtpUpload(ktpFile, values.full_name);
    if (preparedFile.error) {
      return failResponse(preparedFile.error, 400);
    }

    if (preparedFile.fileBuffer && preparedFile.filename) {
      await saveKtpFile(preparedFile.filename, preparedFile.fileBuffer);
      uploadedPath = preparedFile.ktp_file_path;
    }

    const oldKtpPath = normalizeStoredUploadPath(formData.get("oldKtpPath"));
    const currentKtpPath = existingData.rows[0]?.ktp_file_path || null;
    const ktpFilePath = preparedFile.ktp_file_path || oldKtpPath || currentKtpPath;

    const result = await pool.query(
      `
      UPDATE tenant_identities SET
        nik = $1,
        full_name = $2,
        ktp_file_path = $3,
        birth_place = $4,
        birth_date = $5,
        nationality = $6,
        religion = $7,
        occupation = $8,
        street_address = $9,
        rt = $10,
        rw = $11,
        kelurahan = $12,
        district = $13,
        city = $14,
        province = $15,
        phone = $16,
        notes = $17,
        status = $18,
        updated_at = NOW()
      WHERE id = $19
      RETURNING *
      `,
      [
        values.nik,
        values.full_name,
        ktpFilePath,
        values.birth_place,
        values.birth_date,
        values.nationality,
        values.religion,
        values.occupation,
        values.street_address,
        values.rt,
        values.rw,
        values.kelurahan,
        values.district,
        values.city,
        values.province,
        values.phone,
        values.notes,
        values.status,
        id,
      ],
    );

    if (preparedFile.fileBuffer && currentKtpPath && currentKtpPath !== ktpFilePath) {
      await removeKtpFile(currentKtpPath).catch((fileError) =>
        console.warn("Gagal menghapus file KTP lama:", fileError),
      );
    }

    return jsonResponse({
      success: true,
      message: "Data identitas berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    await removeKtpFile(uploadedPath).catch((fileError) =>
      console.warn("Gagal membersihkan file KTP setelah error:", fileError),
    );
    return handleApiError(
      "Error updating identity",
      error,
      "Terjadi kesalahan saat memperbarui data identitas.",
    );
  }
}
