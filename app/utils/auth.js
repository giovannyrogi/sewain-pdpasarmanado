import { cookies } from "next/headers";
import pool from "@/lib/dbConfig";

/**
 * Mengambil user login dari cookie lalu memvalidasinya ulang ke database.
 * API route tidak lewat middleware aplikasi, jadi validasi ini mencegah client
 * mengirim user_id/role_id palsu ketika mengakses endpoint server.
 */
export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const loggedInUser = cookieStore.get("loggedInUser");

  if (!loggedInUser?.value) {
    return null;
  }

  let cookieUser;
  try {
    cookieUser = JSON.parse(loggedInUser.value);
  } catch {
    return null;
  }

  if (!cookieUser?.id || !cookieUser?.role_id) {
    return null;
  }

  if (cookieUser.expiresAt && Date.now() > Number(cookieUser.expiresAt)) {
    return null;
  }

  const result = await pool.query(
    `
    SELECT u.id, u.full_name, u.username, u.email, u.role_id, r.role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1 AND u.role_id = $2
    LIMIT 1
    `,
    [cookieUser.id, cookieUser.role_id],
  );

  return result.rows[0] || null;
}

export function unauthorizedResponse() {
  return Response.json(
    { success: false, message: "Sesi login tidak valid. Silakan login ulang." },
    { status: 401 },
  );
}
