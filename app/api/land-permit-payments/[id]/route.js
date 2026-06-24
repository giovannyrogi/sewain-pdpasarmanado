import fs from "fs";
import path from "path";
import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  getLandPermitPaymentNotificationContext,
  notifyLandPermitPaymentDeleted,
  notifyLandPermitPaymentUpdated,
} from "@/app/utils/notifications";

const WRITE_ROLES = [1, 9];
const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROOF_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "bukti_transfer_ijin_lahan",
);

function sanitizeFilenamePart(value) {
  return (
    String(value || "penyewa")
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "penyewa"
  );
}

function resolveStoredFile(filePath) {
  if (!filePath || !filePath.startsWith("/uploads/bukti_transfer_ijin_lahan/")) {
    return null;
  }

  const resolved = path.resolve(
    process.cwd(),
    filePath.replace(/^\/+/, ""),
  );
  const allowedRoot = path.resolve(uploadDir);
  return resolved.startsWith(allowedRoot) ? resolved : null;
}

export async function PUT(request, { params }) {
  const client = await pool.connect();
  let newStoredFilePath = null;

  try {
    const { user, response } = await requireRole(WRITE_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const paymentId = Number(rawId);
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return Response.json(
        { success: false, message: "ID pembayaran tidak valid." },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const paymentDate = formData.get("payment_date");
    const proofFile = formData.get("proof_file");
    const hasNewFile =
      proofFile && typeof proofFile === "object" && Number(proofFile.size) > 0;

    if (!paymentDate || !moment(paymentDate, "YYYY-MM-DD", true).isValid()) {
      return Response.json(
        { success: false, message: "Tanggal pembayaran tidak valid." },
        { status: 400 },
      );
    }

    if (hasNewFile && proofFile.size > MAX_PROOF_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: "Ukuran file bukti pembayaran maksimal 5MB.",
        },
        { status: 400 },
      );
    }

    const extension = hasNewFile
      ? path.extname(proofFile.name).toLowerCase()
      : "";
    if (hasNewFile && !ALLOWED_PROOF_EXTENSIONS.includes(extension)) {
      return Response.json(
        {
          success: false,
          message: "Format bukti pembayaran harus JPG, PNG, atau PDF.",
        },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const currentResult = await client.query(
      `
      SELECT
        payment.*,
        app.total_payment,
        identity.full_name AS tenant_name
      FROM land_permit_payments payment
      JOIN land_permit_applications app
        ON app.id = payment.land_permit_application_id
      JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
      WHERE payment.id = $1
      FOR UPDATE OF payment
      `,
      [paymentId],
    );

    if (currentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Pembayaran izin lahan tidak ditemukan." },
        { status: 404 },
      );
    }

    const current = currentResult.rows[0];
    if (current.approval_status === "approved") {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Pembayaran yang sudah disetujui tidak dapat diubah.",
        },
        { status: 400 },
      );
    }

    let proofFilePath = current.proof_file_path;
    let newFilename = null;
    if (hasNewFile) {
      newFilename = `bukti_transfer_izin_lahan_${sanitizeFilenamePart(
        current.tenant_name,
      )}_${current.land_permit_application_id}_${moment().format(
        "YYYY_MM_DD_HH_mm_ss_SSS",
      )}${extension}`;
      proofFilePath = `/uploads/bukti_transfer_ijin_lahan/${newFilename}`;
    }

    await client.query(
      `
      UPDATE land_permit_payments
      SET amount = $1,
          payment_date = $2,
          proof_file_path = $3,
          uploaded_by = $4,
          approval_status = 'proses',
          notes = NULL,
          updated_at = NOW()
      WHERE id = $5
      `,
      [
        Number(current.total_payment || 0),
        moment(paymentDate).format("YYYY-MM-DD"),
        proofFilePath,
        user.id,
        paymentId,
      ],
    );

    await client.query(
      `
      UPDATE land_permit_payment_approval
      SET status = 'pending',
          approver_id = NULL,
          notes = NULL,
          approved_at = NULL,
          updated_at = NOW()
      WHERE land_permit_payment_id = $1
      `,
      [paymentId],
    );

    await client.query(
      `
      UPDATE land_permit_applications
      SET payment_status = 'proses',
          is_fully_paid = FALSE,
          updated_at = NOW()
      WHERE id = $1
      `,
      [current.land_permit_application_id],
    );

    const notificationContext =
      await getLandPermitPaymentNotificationContext(client, paymentId);
    if (notificationContext) {
      await notifyLandPermitPaymentUpdated(
        client,
        notificationContext,
        user.id,
      );
    }

    await client.query("COMMIT");

    if (hasNewFile && newFilename) {
      fs.mkdirSync(uploadDir, { recursive: true });
      newStoredFilePath = path.join(uploadDir, newFilename);
      fs.writeFileSync(
        newStoredFilePath,
        Buffer.from(await proofFile.arrayBuffer()),
      );

      const oldStoredFilePath = resolveStoredFile(current.proof_file_path);
      if (
        oldStoredFilePath &&
        oldStoredFilePath !== newStoredFilePath &&
        fs.existsSync(oldStoredFilePath)
      ) {
        try {
          fs.unlinkSync(oldStoredFilePath);
        } catch (fileError) {
          console.error("Gagal menghapus bukti pembayaran lama:", fileError);
        }
      }
    }

    return Response.json({
      success: true,
      message:
        "Bukti pembayaran izin lahan berhasil diperbarui dan menunggu verifikasi ulang.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    if (newStoredFilePath && fs.existsSync(newStoredFilePath)) {
      try {
        fs.unlinkSync(newStoredFilePath);
      } catch {}
    }

    console.error("Error updating land permit payment:", error);
    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat memperbarui bukti pembayaran izin lahan.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}

export async function DELETE(_request, { params }) {
  const client = await pool.connect();

  try {
    const { user, response } = await requireRole(WRITE_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const paymentId = Number(rawId);
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return Response.json(
        { success: false, message: "ID pembayaran tidak valid." },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const currentResult = await client.query(
      `
      SELECT id, land_permit_application_id, proof_file_path, approval_status
      FROM land_permit_payments
      WHERE id = $1
      FOR UPDATE
      `,
      [paymentId],
    );

    if (currentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Pembayaran izin lahan tidak ditemukan." },
        { status: 404 },
      );
    }

    const current = currentResult.rows[0];
    if (current.approval_status === "approved") {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Pembayaran yang sudah disetujui tidak dapat dihapus.",
        },
        { status: 400 },
      );
    }

    const notificationContext =
      await getLandPermitPaymentNotificationContext(client, paymentId);

    await client.query(
      `
      DELETE FROM land_permit_payment_approval
      WHERE land_permit_payment_id = $1
      `,
      [paymentId],
    );
    await client.query(
      "DELETE FROM land_permit_payments WHERE id = $1",
      [paymentId],
    );
    await client.query(
      `
      UPDATE land_permit_applications
      SET payment_status = 'unpaid',
          is_fully_paid = FALSE,
          updated_at = NOW()
      WHERE id = $1
      `,
      [current.land_permit_application_id],
    );

    if (notificationContext) {
      await notifyLandPermitPaymentDeleted(
        client,
        notificationContext,
        user.id,
      );
    }

    await client.query("COMMIT");

    const storedFilePath = resolveStoredFile(current.proof_file_path);
    if (storedFilePath && fs.existsSync(storedFilePath)) {
      try {
        fs.unlinkSync(storedFilePath);
      } catch (fileError) {
        console.error("Gagal menghapus bukti pembayaran:", fileError);
      }
    }

    return Response.json({
      success: true,
      message: "Bukti pembayaran izin lahan berhasil dihapus.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("Error deleting land permit payment:", error);
    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat menghapus bukti pembayaran izin lahan.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
