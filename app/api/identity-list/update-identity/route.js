import pool from "@/lib/dbConfig";
import { normalizeStoredUploadPath } from "@/app/utils/uploadPath";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import {
  prepareKtpUpload,
  prepareProfilePhotoUpload,
  removeKtpFile,
  removeProfilePhotoFile,
  saveKtpFile,
  saveProfilePhotoFile,
} from "../fileHelpers";
import {
  validateIdentityFormData,
  validateIdentityId,
  validateLandPermitIdentityFormData,
} from "../validation";
import {
  ADMIN_IZIN_LAHAN_ROLE_ID,
  getIdentityRegistrationForRole,
  SUPERADMIN_ROLE_ID,
  validateIdentityRegistration,
} from "@/app/utils/identityModules";

const MASTER_DATA_ROLES = [1, 2, 9];

export async function PUT(req) {
  let uploadedPath = null;
  let uploadedProfilePhotoPath = null;

  try {
    const { user, response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;
    const isLandPermitAdmin = Number(user.role_id) === ADMIN_IZIN_LAHAN_ROLE_ID;
    const isSuperadmin = Number(user.role_id) === SUPERADMIN_ROLE_ID;

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
      `
      SELECT 
        ktp_file_path, profile_photo_file_path, status, notes,
        land_permit_status, land_permit_status_notes,
        is_room_rental_registered, is_land_permit_registered
      FROM tenant_identities
      WHERE id = $1
      LIMIT 1
      `,
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

    const registration = getIdentityRegistrationForRole({
      roleId: user.role_id,
      formData,
      existing: existingData.rows[0],
    });
    const registrationError = validateIdentityRegistration(registration);
    if (registrationError) {
      return failResponse(registrationError, 400);
    }

    if (
      isSuperadmin &&
      existingData.rows[0].is_room_rental_registered &&
      !registration.is_room_rental_registered
    ) {
      const roomHistory = await pool.query(
        "SELECT 1 FROM tenant_application WHERE tenant_identity_id = $1 LIMIT 1",
        [id],
      );
      if (roomHistory.rowCount > 0) {
        return failResponse(
          "Modul Sewa Ruangan tidak dapat dilepas karena sudah memiliki riwayat permohonan. Ubah status menjadi nonaktif.",
          409,
        );
      }
    }

    if (
      isSuperadmin &&
      existingData.rows[0].is_land_permit_registered &&
      !registration.is_land_permit_registered
    ) {
      const landHistory = await pool.query(
        "SELECT 1 FROM land_permit_applications WHERE tenant_identity_id = $1 LIMIT 1",
        [id],
      );
      if (landHistory.rowCount > 0) {
        return failResponse(
          "Modul Izin Lahan tidak dapat dilepas karena sudah memiliki riwayat permohonan. Ubah status menjadi nonaktif.",
          409,
        );
      }
    }

    const preparedFile = await prepareKtpUpload(ktpFile, values.full_name);
    if (preparedFile.error) {
      return failResponse(preparedFile.error, 400);
    }

    const oldKtpPath = normalizeStoredUploadPath(formData.get("oldKtpPath"));
    const currentKtpPath = existingData.rows[0]?.ktp_file_path || null;
    const ktpFilePath = preparedFile.ktp_file_path || oldKtpPath || currentKtpPath;
    const currentProfilePhotoPath =
      existingData.rows[0]?.profile_photo_file_path || null;
    let profilePhotoFilePath = currentProfilePhotoPath;
    let landPermitStatus = existingData.rows[0]?.land_permit_status || "active";
    let landPermitStatusNotes =
      existingData.rows[0]?.land_permit_status_notes || "";
    let preparedProfilePhoto = { profile_photo_file_path: null };

    if (isLandPermitAdmin || isSuperadmin) {
      const landPermitValidation = validateLandPermitIdentityFormData(formData);
      if (landPermitValidation.error) {
        return failResponse(landPermitValidation.error, 400);
      }

      preparedProfilePhoto = await prepareProfilePhotoUpload(
        landPermitValidation.profilePhotoFile,
        values.full_name,
      );

      if (preparedProfilePhoto.error) {
        return failResponse(preparedProfilePhoto.error, 400);
      }

      profilePhotoFilePath =
        preparedProfilePhoto.profile_photo_file_path || currentProfilePhotoPath;
      if (isLandPermitAdmin && !profilePhotoFilePath) {
        return failResponse(
          "Pas foto wajib diupload untuk Admin Izin Lahan.",
          400,
        );
      }
      landPermitStatus = landPermitValidation.values.land_permit_status;
      landPermitStatusNotes =
        landPermitValidation.values.land_permit_status_notes;
    }

    const nextStatus = isLandPermitAdmin
      ? existingData.rows[0]?.status || "active"
      : values.status;
    const nextNotes = isLandPermitAdmin
      ? existingData.rows[0]?.notes || ""
      : values.notes;

    if (preparedFile.fileBuffer && preparedFile.filename) {
      await saveKtpFile(preparedFile.filename, preparedFile.fileBuffer);
      uploadedPath = preparedFile.ktp_file_path;
    }

    if (preparedProfilePhoto.fileBuffer && preparedProfilePhoto.filename) {
      await saveProfilePhotoFile(
        preparedProfilePhoto.filename,
        preparedProfilePhoto.fileBuffer,
      );
      uploadedProfilePhotoPath = preparedProfilePhoto.profile_photo_file_path;
    }

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
        profile_photo_file_path = $19,
        land_permit_status = $20::varchar(20),
        land_permit_status_notes = $21::text,
        land_permit_status_updated_at = CASE
          WHEN land_permit_status IS DISTINCT FROM $20::varchar(20)
            OR COALESCE(land_permit_status_notes, '') IS DISTINCT FROM $21::text
          THEN NOW()
          ELSE land_permit_status_updated_at
        END,
        is_room_rental_registered = $22,
        is_land_permit_registered = $23,
        updated_at = NOW()
      WHERE id = $24
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
        nextNotes,
        nextStatus,
        profilePhotoFilePath,
        landPermitStatus,
        landPermitStatusNotes,
        registration.is_room_rental_registered,
        registration.is_land_permit_registered,
        id,
      ],
    );

    if (preparedFile.fileBuffer && currentKtpPath && currentKtpPath !== ktpFilePath) {
      await removeKtpFile(currentKtpPath).catch((fileError) =>
        console.warn("Gagal menghapus file KTP lama:", fileError),
      );
    }

    if (
      (isLandPermitAdmin || isSuperadmin) &&
      uploadedProfilePhotoPath &&
      currentProfilePhotoPath &&
      currentProfilePhotoPath !== profilePhotoFilePath
    ) {
      await removeProfilePhotoFile(currentProfilePhotoPath).catch((fileError) =>
        console.warn("Gagal menghapus file pas foto lama:", fileError),
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
    await removeProfilePhotoFile(uploadedProfilePhotoPath).catch((fileError) =>
      console.warn("Gagal membersihkan file pas foto setelah error:", fileError),
    );
    return handleApiError(
      "Error updating identity",
      error,
      "Terjadi kesalahan saat memperbarui data identitas.",
    );
  }
}
