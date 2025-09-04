import pool from "@/lib/dbConfig";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 1. Cek user (join ke roles untuk dapatkan nama role)
    const userResult = await pool.query(
      `SELECT 
         u.id, u.full_name, u.username, u.nik, u.phone, u.email, u.password, u.role_id, 
         r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );
    if (userResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "Username belum terdaftar" }),
        { status: 400 }
      );
    }
    const user = userResult.rows[0];

    // 2. Cek password (plain, sebaiknya gunakan hash di production)
    if (user.password !== password) {
      return new Response(JSON.stringify({ message: "Password salah" }), {
        status: 401,
      });
    }

    // 3. Hapus password sebelum dikirim ke frontend
    delete user.password;

    // 4. Return user beserta nama rolenya
    return new Response(
      JSON.stringify({
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        nik: user.nik,
        phone: user.phone,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  }
}
