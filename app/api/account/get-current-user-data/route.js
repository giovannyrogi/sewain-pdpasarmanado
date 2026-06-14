import pool from "@/lib/dbConfig";
import {
  forbiddenResponse,
  requireAuthenticatedUser,
} from "@/app/utils/auth";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status });

const isPositiveInteger = (value) => /^[1-9][0-9]*$/.test(String(value || ""));

export async function GET(req) {
  try {
    const { user: authUser, response } = await requireAuthenticatedUser();
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("user_id") || authUser.id;

    if (!isPositiveInteger(requestedUserId)) {
      return jsonResponse(
        { success: false, message: "ID pengguna tidak valid." },
        400,
      );
    }

    if (
      Number(requestedUserId) !== Number(authUser.id) &&
      Number(authUser.role_id) !== 1
    ) {
      return forbiddenResponse("Anda hanya dapat mengakses data akun sendiri.");
    }

    const result = await pool.query(
      `
        SELECT
          u.id,
          u.full_name,
          u.username,
          u.email,
          u.role_id,
          r.role_name,
          u.phone,
          u.created_at,
          u.updated_at
        FROM users u
        LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [requestedUserId],
    );

    if (!result.rows[0]) {
      return jsonResponse(
        { success: false, message: "Data akun tidak ditemukan." },
        404,
      );
    }

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data akun.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error get current account data:", err);
    return jsonResponse(
      { success: false, message: "Terjadi kesalahan saat mengambil data akun." },
      500,
    );
  }
}
