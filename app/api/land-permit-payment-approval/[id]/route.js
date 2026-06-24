import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  getLandPermitPaymentNotificationContext,
  notifyLandPermitPaymentDecision,
} from "@/app/utils/notifications";

const APPROVAL_ROLES = [1, 8];

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { user, response } = await requireRole(APPROVAL_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const approvalId = Number(rawId);
    const body = await request.json();
    const paymentId = Number(body.payment_id);
    const status = String(body.status || "").toLowerCase();
    const notes = String(body.notes || "").trim();
    const isApproved = status === "approved";

    if (!Number.isInteger(approvalId) || approvalId <= 0) {
      return Response.json(
        { success: false, message: "ID approval tidak valid." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return Response.json(
        { success: false, message: "ID pembayaran tidak valid." },
        { status: 400 },
      );
    }
    if (!["approved", "rejected"].includes(status)) {
      return Response.json(
        { success: false, message: "Status approval tidak valid." },
        { status: 400 },
      );
    }
    if (status === "rejected" && !notes) {
      return Response.json(
        { success: false, message: "Alasan penolakan wajib diisi." },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const approvalResult = await client.query(
      `
      SELECT
        approval.*,
        payment.land_permit_application_id,
        payment.approval_status AS payment_status
      FROM land_permit_payment_approval approval
      JOIN land_permit_payments payment
        ON payment.id = approval.land_permit_payment_id
      WHERE approval.id = $1
      FOR UPDATE OF approval, payment
      `,
      [approvalId],
    );

    if (approvalResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Approval pembayaran tidak ditemukan." },
        { status: 404 },
      );
    }

    const approval = approvalResult.rows[0];
    if (Number(approval.land_permit_payment_id) !== paymentId) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Approval tidak sesuai dengan pembayaran.",
        },
        { status: 400 },
      );
    }
    if (Number(user.role_id) !== 1 && Number(approval.role_id) !== Number(user.role_id)) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Anda tidak memiliki akses untuk verifikasi ini.",
        },
        { status: 403 },
      );
    }
    if (
      approval.status !== "pending" ||
      approval.payment_status !== "proses"
    ) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Pembayaran ini sudah diproses atau tidak lagi menunggu verifikasi.",
        },
        { status: 400 },
      );
    }

    await client.query(
      `
      UPDATE land_permit_payment_approval
      SET status = $1,
          notes = $2,
          approver_id = $3,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $4
      `,
      [status, notes || null, user.id, approvalId],
    );

    await client.query(
      `
      UPDATE land_permit_payments
      SET approval_status = $1,
          notes = $2,
          accounting_date = CASE
            WHEN $4::boolean THEN CURRENT_DATE
            ELSE accounting_date
          END,
          updated_at = NOW()
      WHERE id = $3
      `,
      [status, notes || null, paymentId, isApproved],
    );

    await client.query(
      `
      UPDATE land_permit_applications
      SET payment_status = $1,
          is_fully_paid = $2,
          permit_status = CASE
            WHEN $2::boolean THEN 'active'
            ELSE permit_status
          END,
          updated_at = NOW()
      WHERE id = $3
      `,
      [
        isApproved ? "paid" : "rejected",
        isApproved,
        approval.land_permit_application_id,
      ],
    );

    const notificationContext =
      await getLandPermitPaymentNotificationContext(client, paymentId);
    if (notificationContext) {
      await notifyLandPermitPaymentDecision(
        client,
        notificationContext,
        user.id,
        status,
        notes,
      );
    }

    await client.query("COMMIT");

    return Response.json({
      success: true,
      message:
        status === "approved"
          ? "Pembayaran izin lahan berhasil disetujui."
          : "Pembayaran izin lahan berhasil ditolak.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("Error processing land permit payment approval:", error);
    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat memproses verifikasi pembayaran izin lahan.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
