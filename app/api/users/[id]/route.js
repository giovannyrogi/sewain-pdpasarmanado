import pool from "@/lib/dbConfig";

// UPDATE user
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id dari URL
    const body = await request.json(); // data dari body
    const { username, password, email, fullName, roleId } = body;

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

    // Cek duplikasi email (kecuali user ini sendiri)
    if (email) {
      const checkEmail = await pool.query(
        "SELECT 1 FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );
      if (checkEmail.rows.length > 0) {
        return new Response(
          JSON.stringify({ success: false, message: "Email sudah terdaftar!" }),
          { status: 400 }
        );
      }
    }

    // Lakukan update
    const result = await pool.query(
      `UPDATE users SET username=$1, password=$2, email=$3, full_name=$4, role_id=$5
       WHERE id=$6 RETURNING *`,
      [username, password, email, fullName, roleId, id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "User tidak ditemukan" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengubah data user",
        data: result.rows[0],
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

// DELETE user
export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User tidak ditemukan atau gagal dihapus",
        }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ success: true, message: "Berhasil menghapus user" }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error delete user", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
