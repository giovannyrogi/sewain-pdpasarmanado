// app/api/login/route.js
import pool from "@/lib/dbConfig";
import { NextResponse } from "next/server";

const APPROVAL_STEPS = [
  { role_id: 3, step_order: 1 }, // kasie
  { role_id: 4, step_order: 2 }, // kasubdiv
  { role_id: 5, step_order: 3 }, // kadiv
  { role_id: 6, step_order: 4 }, // dirbis
  { role_id: 7, step_order: 5 }, // dirut
];

const getStepOrderByRole = (role_id) => {
  const found = APPROVAL_STEPS.find((a) => a.role_id === role_id);
  return found ? found.step_order : null;
};

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 1. Cek user di database
    const userResult = await pool.query(
      `SELECT 
         u.id, u.full_name, u.username, u.email, u.password, u.role_id, 
         r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: "Username belum terdaftar" },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // 2. Cek password
    if (user.password !== password) {
      return NextResponse.json({ message: "Password salah" }, { status: 401 });
    }

    // 3. Tambahkan step_order berdasarkan role
    const step_order = getStepOrderByRole(user.role_id);

    // 4. Hapus password sebelum dikirim ke frontend
    delete user.password;

    const SESSION_DURATION_MINUTES = 60; // durasi session dalam menit
    const expiresAt = Date.now() + SESSION_DURATION_MINUTES * 60 * 1000; // timestamp expired

    // 5. Simpan user ke cookie
    const userPayload = {
      ...user,
      step_order,
      expiresAt,
    };

    const response = NextResponse.json(user, { status: 200 });
    response.cookies.set("loggedInUser", JSON.stringify(userPayload), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
