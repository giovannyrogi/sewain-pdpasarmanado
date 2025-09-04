import pool from "@/lib/dbConfig";

// CREATE user
export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password, email, fullName, roleId, phone } = body;

    // Validasi field wajib
    if (!username || !password || !email || !fullName || !roleId || !phone) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    // Cek duplikasi username
    const checkUser = await pool.query(
      `SELECT 1 FROM users WHERE username = $1`,
      [username]
    );
    if (checkUser.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username sudah terdaftar!",
        }),
        { status: 400 }
      );
    }

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, password, email, full_name, role_id, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [username, password, email, fullName, roleId, phone]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menambah user baru",
        data: result.rows[0],
      }),
      { status: 201 }
    );
  } catch (err) {
    // Tangani error duplicate email
    if (err.code === "23505" && err.detail && err.detail.includes("email")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email sudah terdaftar!",
        }),
        { status: 400 }
      );
    }
    // Tangani error duplicate username (jika ada race condition)
    if (err.code === "23505" && err.detail && err.detail.includes("username")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Username sudah terdaftar!",
        }),
        { status: 400 }
      );
    }
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
    // Ambil role dari query parameter
    const { searchParams } = new URL(req.url);
    const role_id = searchParams.get("role_id");
    // console.log("role serverside GET", role_id);

    const result = await pool.query(
      `SELECT 
        u.id,
        u.full_name,
        u.username,
        u.password,
        u.nik,
        u.phone,
        u.email,
        u.role_id,
        r.role_name,
        u.created_at,
        u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC`
    );

    // console.log("result", result);

    const rows = result.rows.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      password: user.password,
      nik: user.nik,
      phone: user.phone,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data user",
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
