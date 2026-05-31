import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

export async function PUT() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    /**
     * Bersihkan berarti arsip per user, bukan delete permanen.
     * Data utama di tabel notifications tetap ada untuk kebutuhan audit ringan.
     */
    await pool.query(
      `
      UPDATE notification_recipients
      SET archived_at = COALESCE(archived_at, NOW()),
          read_at = COALESCE(read_at, NOW())
      WHERE user_id = $1
        AND archived_at IS NULL
      `,
      [user.id],
    );

    return Response.json({
      success: true,
      message: "Daftar notifikasi berhasil dibersihkan",
    });
  } catch (err) {
    console.error("Error PUT /api/notifications/archive-all:", err);
    return Response.json(
      { success: false, message: "Gagal membersihkan notifikasi" },
      { status: 500 },
    );
  }
}
