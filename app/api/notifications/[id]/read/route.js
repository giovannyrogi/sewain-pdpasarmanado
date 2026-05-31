import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

export async function PUT(req, { params }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const result = await pool.query(
      `
      UPDATE notification_recipients
      SET read_at = COALESCE(read_at, NOW())
      WHERE notification_id = $1
        AND user_id = $2
        AND archived_at IS NULL
      RETURNING id
      `,
      [id, user.id],
    );

    if (result.rowCount === 0) {
      return Response.json(
        { success: false, message: "Notifikasi tidak ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Notifikasi ditandai sudah dibaca",
    });
  } catch (err) {
    console.error("Error PUT /api/notifications/[id]/read:", err);
    return Response.json(
      { success: false, message: "Gagal membaca notifikasi" },
      { status: 500 },
    );
  }
}
