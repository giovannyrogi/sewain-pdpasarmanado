import pool from "@/lib/dbConfig";

// UPDATE Role
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id dari URL
    const body = await request.json(); // data dari body
    const { roleName } = body;

    // Cek duplikasi username (kecuali user ini sendiri)
    const checkRoleName = await pool.query(
      "SELECT 1 FROM roles WHERE role_name = $1 AND id != $2",
      [roleName, id]
    );
    if (checkRoleName.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Role sudah terdaftar!",
        }),
        { status: 400 }
      );
    }

    // Lakukan update
    const result = await pool.query(
      `UPDATE roles SET role_name=$1 WHERE id=$2 RETURNING *`,
      [roleName, id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Role tidak ditemukan" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengubah data role",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("Error update role", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

// DELETE ROle
export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    const result = await pool.query(
      `DELETE FROM roles WHERE id=$1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Role tidak ditemukan atau gagal dihapus",
        }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ success: true, message: "Berhasil menghapus role" }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error delete role", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
