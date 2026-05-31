import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const requestedLimit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    /**
     * Notifikasi diambil dari tabel penerima, bukan langsung dari tabel event,
     * supaya user hanya melihat notifikasi yang memang ditujukan untuk akunnya.
     */
    const notifications = await pool.query(
      `
      SELECT
        nr.id AS recipient_id,
        nr.read_at,
        nr.archived_at,
        n.id,
        n.type,
        n.title,
        n.message,
        n.entity_type,
        n.entity_id,
        n.action_url,
        n.priority,
        n.metadata,
        n.created_by,
        n.created_at
      FROM notification_recipients nr
      JOIN notifications n ON n.id = nr.notification_id
      WHERE nr.user_id = $1
        AND nr.archived_at IS NULL
        AND ($2::boolean = false OR nr.read_at IS NULL)
      ORDER BY n.created_at DESC
      LIMIT $3
      `,
      [user.id, unreadOnly, limit],
    );

    const unread = await pool.query(
      `
      SELECT COUNT(*)::integer AS total
      FROM notification_recipients
      WHERE user_id = $1
        AND read_at IS NULL
        AND archived_at IS NULL
      `,
      [user.id],
    );

    return Response.json({
      success: true,
      message: "Berhasil mengambil notifikasi",
      data: notifications.rows,
      unread_count: unread.rows[0]?.total || 0,
    });
  } catch (err) {
    console.error("Error GET /api/notifications:", err);
    return Response.json(
      { success: false, message: "Gagal mengambil notifikasi" },
      { status: 500 },
    );
  }
}
