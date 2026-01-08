import pool from "@/lib/dbConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  try {
    const result = await pool.query(`SELECT * FROM users u where id = $1;`, [
      user_id,
    ]);

    const user = result.rows[0];

    const data = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      phone: user.phone,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data user",
        data: data,
      }),
      { status: 200 }
    );

    // console.log("result", result);
  } catch (err) {
    console.log("error", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
