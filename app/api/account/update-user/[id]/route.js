import pool from "@/lib/dbConfig";
import {
  forbiddenResponse,
  requireAuthenticatedUser,
} from "@/app/utils/auth";
import { normalizeIndonesianPhone } from "@/app/utils/phoneNumber";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

const isPositiveInteger = (value) => /^[1-9][0-9]*$/.test(String(value || ""));

const normalizeProfileBody = (body) => {
  const fullName = String(body?.fullName || "").trim();
  const username = String(body?.username || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = normalizeIndonesianPhone(body?.phone);

  if (!fullName) return { error: "Nama lengkap wajib diisi." };
  if (fullName.length > 100) return { error: "Nama lengkap maksimal 100 karakter." };
  if (!username) return { error: "Username wajib diisi." };
  if (username.length > 100) return { error: "Username maksimal 100 karakter." };
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username hanya boleh berisi huruf, angka, titik, underscore, atau strip.",
    };
  }
  if (!email) return { error: "Email wajib diisi." };
  if (email.length > 100) return { error: "Email maksimal 100 karakter." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Format email tidak valid." };
  if (phone.error) return { error: phone.error };

  return {
    values: {
      fullName,
      username,
      email,
      phone: phone.value,
    },
  };
};

export async function PUT(request, { params }) {
  try {
    const { user: authUser, response } = await requireAuthenticatedUser();
    if (response) return response;

    const { id } = await params;
    if (!isPositiveInteger(id)) {
      return jsonResponse(
        { success: false, message: "ID pengguna tidak valid." },
        400,
      );
    }

    if (Number(id) !== Number(authUser.id) && Number(authUser.role_id) !== 1) {
      return forbiddenResponse("Anda hanya dapat mengubah data akun sendiri.");
    }

    const normalized = normalizeProfileBody(await request.json());
    if (normalized.error) {
      return jsonResponse({ success: false, message: normalized.error }, 400);
    }

    const { fullName, username, email, phone } = normalized.values;

    const duplicate = await pool.query(
      `
        SELECT
          MAX(CASE WHEN LOWER(username) = LOWER($1) THEN 1 ELSE 0 END) AS username_exists,
          MAX(CASE WHEN LOWER(email) = LOWER($2) THEN 1 ELSE 0 END) AS email_exists
        FROM users
        WHERE id <> $3
          AND (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2))
      `,
      [username, email, id],
    );

    if (Number(duplicate.rows[0]?.username_exists) === 1) {
      return jsonResponse(
        { success: false, message: "Username sudah terdaftar." },
        409,
      );
    }

    if (Number(duplicate.rows[0]?.email_exists) === 1) {
      return jsonResponse(
        { success: false, message: "Email sudah terdaftar." },
        409,
      );
    }

    const result = await pool.query(
      `
        UPDATE users
        SET
          username = $1,
          phone = $2,
          full_name = $3,
          email = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING
          id,
          full_name,
          username,
          email,
          role_id,
          phone,
          created_at,
          updated_at
      `,
      [username, phone, fullName, email, id],
    );

    if (!result.rows[0]) {
      return jsonResponse(
        { success: false, message: "Data akun tidak ditemukan." },
        404,
      );
    }

    const roleResult = await pool.query(
      "SELECT role_name FROM roles WHERE id = $1 LIMIT 1",
      [result.rows[0].role_id],
    );

    return jsonResponse({
      success: true,
      message: "Informasi akun berhasil diperbarui.",
      data: {
        ...result.rows[0],
        role_name: roleResult.rows[0]?.role_name || null,
      },
    });
  } catch (err) {
    console.error("Error update account profile:", err);
    return jsonResponse(
      { success: false, message: "Terjadi kesalahan saat mengubah data akun." },
      500,
    );
  }
}
