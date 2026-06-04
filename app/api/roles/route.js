import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";

const SUPERADMIN_ROLE_ID = 1;

// CREATE Role
export async function POST(req) {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const body = await req.json();
    const { roleName } = body;

    // Validasi field wajib
    if (!roleName) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    // Cek duplikasi username
    const checkUser = await pool.query(
      `SELECT 1 FROM roles WHERE role_name = $1`,
      [roleName]
    );
    if (checkUser.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Role sudah terdaftar!",
        }),
        { status: 400 }
      );
    }

    // Insert user
    const result = await pool.query(
      `INSERT INTO roles (role_name)
       VALUES ($1) RETURNING *`,
      [roleName]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menambah role baru",
        data: result.rows[0],
      }),
      { status: 201 }
    );
  } catch (err) {
    // Error lain
    console.error("Error POST /api/users:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan pada server.",
      }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    // Ambil role dari query parameter
    const { searchParams } = new URL(req.url);
    const role_id = searchParams.get("role_id");
    // console.log("role serverside GET", role_id);

    const result = await pool.query(
      `SELECT * FROM roles order by created_at DESC`
    );

    // console.log("result", result);

    const rows = result.rows.map((user) => ({
      id: user.id,
      role_name: user.role_name,
      username: user.username,
      updated_at: user.updated_at,
      created_at: user.created_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data role",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
