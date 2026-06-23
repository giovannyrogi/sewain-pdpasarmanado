import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { prepareKtpUpload, removeKtpFile, saveKtpFile } from "./fileHelpers";
import { validateIdentityFormData } from "./validation";

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
  street_address: row.street_address,
  rt: row.rt,
  rw: row.rw,
  kelurahan: row.kelurahan,
  district: row.district,
  city: row.city,
  province: row.province,
  postal_code: row.postal_code,
  phone: row.phone,
  status: row.status,
  notes: row.notes,
  updated_at: row.updated_at
    ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
  created_at: row.created_at
    ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
});

export async function POST(req) {
  let uploadedPath = null;

  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const formData = await req.formData();
    const { values, ktpFile, error } = validateIdentityFormData(formData, {
      requireFile: true,
    });

    if (error) {
      return failResponse(error, 400);
    }

    const duplicateNik = await pool.query(
      "SELECT 1 FROM tenant_identities WHERE nik = $1 LIMIT 1",
      [values.nik],
    );

    if (duplicateNik.rowCount > 0) {
      return failResponse("NIK sudah terdaftar.", 409);
    }

    const preparedFile = await prepareKtpUpload(ktpFile, values.full_name);
    if (preparedFile.error) {
      return failResponse(preparedFile.error, 400);
    }

    await saveKtpFile(preparedFile.filename, preparedFile.fileBuffer);
    uploadedPath = preparedFile.ktp_file_path;

    const result = await pool.query(
      `
      INSERT INTO tenant_identities (
        nik, full_name, ktp_file_path, birth_place, birth_date, nationality,
        religion, occupation, street_address, rt, rw, kelurahan, district,
        city, province, phone, status, notes
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18
      )
      RETURNING *
      `,
      [
        values.nik,
        values.full_name,
        preparedFile.ktp_file_path,
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
        values.status,
        values.notes,
      ],
    );

    return jsonResponse(
      {
        success: true,
        message: "Data identitas berhasil ditambahkan.",
        data: mapIdentityRow(result.rows[0]),
      },
      201,
    );
  } catch (error) {
    await removeKtpFile(uploadedPath).catch((fileError) =>
      console.warn("Gagal membersihkan file KTP setelah error:", fileError),
    );
    return handleApiError(
      "Error creating identity",
      error,
      "Terjadi kesalahan saat menambah data identitas.",
    );
  }
}

export async function GET() {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    const result = await pool.query(
      `
      SELECT 
        id, user_id, nik, full_name, ktp_file_path, birth_place, birth_date,
        nationality, religion, occupation, street_address, rt, rw, kelurahan,
        district, city, province, postal_code, phone, status, notes,
        created_at, updated_at
      FROM tenant_identities
      ORDER BY created_at DESC
      `,
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data identitas penyewa.",
      data: result.rows.map(mapIdentityRow),
    });
  } catch (error) {
    return handleApiError(
      "Error fetching identities",
      error,
      "Terjadi kesalahan saat mengambil data identitas.",
    );
  }
}
