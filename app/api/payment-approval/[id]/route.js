import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  getPaymentNotificationContext,
  notifyPaymentDecision,
} from "@/app/utils/notifications";

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      payment_id,
      status,
      tenant_application_id,
    } = body;
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }
    const approver_id = authUser.id;
    const role_id = authUser.role_id;

    if (!["approved"].includes(status)) {
      return Response.json(
        { success: false, message: "Status tidak valid" },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const approvalRes = await client.query(
      `SELECT * FROM payment_approval WHERE id=$1`,
      [id],
    );
    if (approvalRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Data Payment Approval tidak ditemukan" },
        { status: 404 },
      );
    }

    const approvalData = approvalRes.rows[0];
    if (Number(approvalData.payment_id) !== Number(payment_id)) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Data approval tidak sesuai dengan pembayaran" },
        { status: 400 },
      );
    }

    if (approvalData.role_id !== role_id) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Anda tidak memiliki akses untuk approval ini" },
        { status: 403 },
      );
    }

    const paymentRes = await client.query(
      `SELECT * FROM payments WHERE id=$1`,
      [payment_id],
    );
    if (paymentRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Data Payment tidak ditemukan" },
        { status: 404 },
      );
    }

    const updateApproval = await client.query(
      `
      UPDATE payment_approval
      SET status=$1, approver_id=$2, approved_at=$3
      WHERE id=$4 AND payment_id=$5
      RETURNING *
      `,
      [status, approver_id, new Date(), id, payment_id],
    );

    if (updateApproval.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Approval pembayaran gagal diperbarui" },
        { status: 400 },
      );
    }

    await client.query(
      `
      UPDATE payments
      SET approval_status=$1
      WHERE id=$2
      `,
      [status, payment_id],
    );

    await client.query(
      `
      UPDATE payment_receipts
      SET status = 'approved',
          approved_at = NOW(),
          approved_by = $1,
          updated_at = NOW()
      WHERE payment_id = $2
      `,
      [approver_id, payment_id],
    );

    const latestPaymentRes = await client.query(
      `
      SELECT remaining_balance
      FROM payments
      WHERE tenant_application_id = $1
      ORDER BY payment_number DESC
      LIMIT 1
      `,
      [tenant_application_id],
    );

    const latestRemaining = parseFloat(
      latestPaymentRes.rows[0]?.remaining_balance || 0,
    );

    if (latestRemaining <= 0) {
      await client.query(
        `
        UPDATE tenant_application
        SET is_fully_paid = true
        WHERE id = $1
        `,
        [tenant_application_id],
      );
    }

    const paymentContext = await getPaymentNotificationContext(client, payment_id);

    // Keputusan keuangan dikirim hanya ke pihak pembayaran terkait:
    // uploader/admin kontrak, pembuat permohonan, dan approver keuangan.
    if (paymentContext) {
      await notifyPaymentDecision(
        client,
        paymentContext,
        approver_id,
        status,
        null,
      );
    }

    await client.query("COMMIT");

    return Response.json({
      success: true,
      message: "Payment Approval berhasil diproses",
      data: updateApproval.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error update Payment Approval", err);
    return Response.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
