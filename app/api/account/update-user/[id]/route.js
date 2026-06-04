import pool from "@/lib/dbConfig";
import { forbiddenResponse, requireAuthenticatedUser } from "@/app/utils/auth";

// UPDATE user
export async function PUT(request, { params }) {
  try {
    const { user: authUser, response } = await requireAuthenticatedUser();
    if (response) return response;

    const { id } = await params; // id dari URL

    if (Number(id) !== Number(authUser.id) && Number(authUser.role_id) !== 1) {
      return forbiddenResponse("Anda hanya dapat mengubah data akun sendiri.");
    }

    const body = await request.json(); // data dari body
    const { username, phone, fullName, email } = body;

    // Cek duplikasi username (kecuali user ini sendiri)
    const checkUsername = await pool.query(
      "SELECT 1 FROM users WHERE username = $1 AND id != $2",
      [username, id]
    );

    if (checkUsername.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username sudah terdaftar!",
        }),
        { status: 400 }
      );
    }

    // Lakukan update
    const result = await pool.query(
      `UPDATE users SET username=$1, phone=$2, full_name=$3, email=$4 WHERE id=$5 RETURNING *`,
      [username, phone, fullName, email, id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "User tidak ditemukan" }),
        { status: 404 }
      );
    }
    const { password: _password, ...safeUser } = result.rows[0];

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengubah data user",
        data: safeUser,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error update user", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
