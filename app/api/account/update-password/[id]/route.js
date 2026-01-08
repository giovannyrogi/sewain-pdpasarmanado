import pool from "@/lib/dbConfig";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const { id } = await params; // ambil id user dari URL
    const { oldPassword, newPassword, comfirmNewPassword } = await req.json();

    // Validasi input dasar
    if (!oldPassword) {
      return NextResponse.json(
        { success: false, message: "Password lama wajib diisi." },
        { status: 200 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { success: false, message: "Password Baru wajib diisi." },
        { status: 200 }
      );
    }

    if (!comfirmNewPassword) {
      return NextResponse.json(
        { success: false, message: "Konfirmasi Password Baru wajib diisi." },
        { status: 200 }
      );
    }

    // Pastikan password baru dan konfirmasi sama
    if (newPassword !== comfirmNewPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Password baru dan konfirmasi Password tidak sama.",
        },
        { status: 200 }
      );
    }

    // Ambil user dari database
    const userRes = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 200 }
      );
    }

    const user = userRes.rows[0];

    // Cek apakah password lama benar
    if (user.password !== oldPassword) {
      return NextResponse.json(
        { success: false, message: "Password lama salah." },
        { status: 200 }
      );
    }

    // Update password di database
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
      newPassword,
      id,
    ]);

    return NextResponse.json(
      { success: true, message: "Password berhasil diperbarui." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error update password:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
