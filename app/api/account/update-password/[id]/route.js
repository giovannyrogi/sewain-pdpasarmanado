import pool from "@/lib/dbConfig";
import { NextResponse } from "next/server";
import {
  forbiddenResponse,
  requireAuthenticatedUser,
} from "@/app/utils/auth";

const isPositiveInteger = (value) => /^[1-9][0-9]*$/.test(String(value || ""));

const validatePasswordBody = (body) => {
  const oldPassword = String(body?.oldPassword || "");
  const newPassword = String(body?.newPassword || "");
  const comfirmNewPassword = String(body?.comfirmNewPassword || "");

  if (!oldPassword) return { error: "Password lama wajib diisi." };
  if (!newPassword) return { error: "Password baru wajib diisi." };
  if (newPassword.length < 6) return { error: "Password baru minimal 6 karakter." };
  if (newPassword.length > 255) {
    return { error: "Password baru maksimal 255 karakter." };
  }
  if (!comfirmNewPassword) {
    return { error: "Konfirmasi password baru wajib diisi." };
  }
  if (newPassword !== comfirmNewPassword) {
    return { error: "Password baru dan konfirmasi password tidak sama." };
  }

  return { values: { oldPassword, newPassword } };
};

export async function PUT(req, { params }) {
  try {
    const { user: authUser, response } = await requireAuthenticatedUser();
    if (response) return response;

    const { id } = await params;
    if (!isPositiveInteger(id)) {
      return NextResponse.json(
        { success: false, message: "ID pengguna tidak valid." },
        { status: 400 },
      );
    }

    if (Number(id) !== Number(authUser.id) && Number(authUser.role_id) !== 1) {
      return forbiddenResponse("Anda hanya dapat mengubah password akun sendiri.");
    }

    const normalized = validatePasswordBody(await req.json());
    if (normalized.error) {
      return NextResponse.json(
        { success: false, message: normalized.error },
        { status: 400 },
      );
    }

    const userRes = await pool.query(
      "SELECT id, password FROM users WHERE id = $1 LIMIT 1",
      [id],
    );

    if (!userRes.rows[0]) {
      return NextResponse.json(
        { success: false, message: "Data akun tidak ditemukan." },
        { status: 404 },
      );
    }

    // Password masih mengikuti mekanisme lama aplikasi agar tidak mengubah flow login.
    if (userRes.rows[0].password !== normalized.values.oldPassword) {
      return NextResponse.json(
        { success: false, message: "Password lama salah." },
        { status: 400 },
      );
    }

    await pool.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [normalized.values.newPassword, id],
    );

    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Error update account password:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mengubah password." },
      { status: 500 },
    );
  }
}
