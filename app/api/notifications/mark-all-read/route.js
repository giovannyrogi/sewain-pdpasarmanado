import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

export async function PUT() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    /**
     * read_at hanya diisi pada notifikasi aktif milik user login.
     * Notifikasi yang sudah dibersihkan tidak disentuh agar histori tetap stabil.
     */
    await pool.query(
      `
      UPDATE notification_recipients
      SET read_at = COALESCE(read_at, NOW())
      WHERE user_id = $1
        AND archived_at IS NULL
      `,
      [user.id],
    );

    return Response.json({
      success: true,
      message: "Semua notifikasi ditandai sudah dibaca",
    });
  } catch (err) {
    console.error("Error PUT /api/notifications/mark-all-read:", err);
    return Response.json(
      { success: false, message: "Gagal menandai notifikasi" },
      { status: 500 },
    );
  }
}
