import pool from "@/lib/dbConfig";
import path from "path";
import fs from "fs";
import moment from "moment";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  getPaymentNotificationContext,
  notifyPaymentDeleted,
  notifyPaymentUpdated,
} from "@/app/utils/notifications";
import { calculatePaymentPphAmount } from "@/app/utils/calculatePphAmount";

const uploadDir = path.join(process.cwd(), "uploads", "bukti_transfer");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const padReceiptNumber = (id) => String(id).padStart(6, "0");
const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROOF_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

function sanitizeFilenamePart(value) {
  return String(value || "tenant")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "tenant";
}

const getPaymentLabel = (paymentType, paymentNumber) => {
  if (paymentType === "lunas") return "Lunas";
  if (Number(paymentNumber) === 1) return "Uang Muka";
  return `Cicilan ${Number(paymentNumber) - 1}`;
};

export async function PUT(req, { params }) {
  const { id } = await params;
  const client = await pool.connect();

  try {
    const formData = await req.formData();
    const tenantName = formData.get("tenant_name") || "tenant";

    // Ambil data payment lama
    const oldPaymentRes = await client.query(
      `SELECT p.*, pa.id AS payment_approval_id 
       FROM payments p 
       LEFT JOIN payment_approval pa ON pa.payment_id = p.id
       WHERE p.id = $1`,
      [id]
    );

    if (oldPaymentRes.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data payment tidak ditemukan.",
        }),
        { status: 404 }
      );
    }

    const oldData = oldPaymentRes.rows[0];
    let proofFilePath = oldData.proof_file_path; // default pakai data lama
    let newFilePath = null;
    let oldFilePathToDelete = null;

    // Ambil data form
    const amount = formData.get("amount");
    const contractAmount = formData.get("contract_amount");
    const ppnAmount = formData.get("ppn_amount");
    const remainingBalance = formData.get("remaining_balance");
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }
    const uploadedBy = authUser.id;
    const approvalStatus = "proses";
    const paymentDate =
      formData.get("payment_date") ||
      moment(oldData.payment_date).format("YYYY-MM-DD");
    const proofFile = formData.get("proof_file");
    const payment_approval_id = formData.get("payment_approval_id");
    const paymentType = formData.get("payment_type");
    const paymentNumber = formData.get("payment_number") || oldData.payment_number;

    // Ambil data tenant application dari database supaya nilai kontrak tidak
    // bergantung pada payload frontend. Lunas harus memakai total sewa ruangan
    // sebelum PPN/admin sebagai contract_amount dan dasar PPH.
    const tenantApplicationResult = await client.query(
      `
      SELECT payment_type, total_payment_room, total_ppn
      FROM tenant_application
      WHERE id = $1
      `,
      [oldData.tenant_application_id]
    );

    if (tenantApplicationResult.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data permohonan sewa tidak ditemukan.",
        }),
        { status: 404 }
      );
    }

    const tenantApplication = tenantApplicationResult.rows[0];
    const effectivePaymentType =
      tenantApplication.payment_type || paymentType || oldData.payment_type;
    const contractAmountValue =
      effectivePaymentType === "lunas"
        ? Number(tenantApplication.total_payment_room || 0)
        : Number(contractAmount) || Number(amount || 0) / 1.11;
    const ppnAmountValue =
      effectivePaymentType === "lunas"
        ? Number(tenantApplication.total_ppn || ppnAmount || 0)
        : Number(ppnAmount) || Number(amount || 0) - contractAmountValue;

    // validasi status hanya proses atau rejected
    if (!approvalStatus === "proses" || !approvalStatus === "rejected") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Status tidak valid",
        }),
        { status: 400 }
      );
    }

    // validasi data wajib
    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter id (payment_id) wajib diisi",
        }),
        { status: 400 }
      );
    }

    if (!payment_approval_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter id (payment_approval_id) wajib diisi",
        }),
        { status: 400 }
      );
    }

    if (!proofFile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bukti transfer wajib diisi",
        }),
        { status: 400 }
      );
    }

    if (!paymentDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tanggal Pembayaran wajib diisi",
        }),
        { status: 400 }
      );
    }

    // Cek apakah ada file baru
    let fileBuffer = null;
    let filename = null;
    if (proofFile && typeof proofFile === "object") {
      if (proofFile.size > MAX_PROOF_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Ukuran file bukti pembayaran maksimal 5MB",
          }),
          { status: 400 }
        );
      }

      const ext = path.extname(proofFile.name).toLowerCase() || ".jpg";
      if (!ALLOWED_PROOF_EXTENSIONS.includes(ext)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Format file bukti pembayaran tidak valid",
          }),
          { status: 400 }
        );
      }

      filename = `bukti_transfer_${sanitizeFilenamePart(tenantName)}_${moment().format("YYYY_MM_DD_HH_mm_ss")}${ext}`;
      newFilePath = path.join(uploadDir, filename);
      proofFilePath = `/uploads/bukti_transfer/${filename}`;

      oldFilePathToDelete = path.normalize(path.join(
        process.cwd(),
        oldData.proof_file_path.replace(/^\/+/, "")
      ));

      const arrayBuffer = await proofFile.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    // Mulai transaksi
    await client.query("BEGIN");

    // Update data payments
    const updateQuery = `
      UPDATE payments
      SET amount = $1,
          contract_amount = $2,
          ppn_amount = $3,
          remaining_balance = $4,
          uploaded_by = $5,
          approval_status = $6,
          payment_date = $7,
          proof_file_path = $8
      WHERE id = $9
    `;
    const updateValues = [
      amount,
      contractAmountValue,
      ppnAmountValue,
      remainingBalance,
      uploadedBy,
      approvalStatus,
      moment(paymentDate).format("YYYY-MM-DD"),
      proofFilePath,
      id,
    ];

    await client.query(updateQuery, updateValues);

    // Update status approval di tabel payment_approval
    if (payment_approval_id) {
      await client.query(
        `UPDATE payment_approval
         SET status = 'pending', approver_id = NULL, notes = NULL, approved_at = NULL
         WHERE id = $1`,
        [payment_approval_id]
      );
    }

    const receiptYear = moment(paymentDate).format("YYYY");
    const receiptSequence = padReceiptNumber(id);
    const contractReceiptNumber = `PEN-${receiptYear}-${receiptSequence}`;
    const pphReceiptNumber = `PEM-${receiptYear}-${receiptSequence}`;
    const paymentLabel = getPaymentLabel(effectivePaymentType, paymentNumber);
    const pphAmount = calculatePaymentPphAmount({
      paymentType: effectivePaymentType,
      paymentAmount: amount,
      contractAmount: contractAmountValue,
      totalPaymentRoom: contractAmountValue,
    });

    await client.query(
      `
      INSERT INTO payment_receipts (
        payment_id,
        receipt_type,
        receipt_number,
        receipt_date,
        account_code,
        amount,
        contract_amount,
        ppn_amount,
        pph_amount,
        description,
        status,
        created_at,
        updated_at
      )
      VALUES
        ($1, 'contract', $2, $3, '4-250', $4, $5, $6, 0, $7, 'draft', NOW(), NOW()),
        ($1, 'pph', $8, $3, '5-192', 0, $5, 0, $9, $10, 'draft', NOW(), NOW())
      ON CONFLICT (payment_id, receipt_type)
      DO UPDATE SET
        receipt_date = EXCLUDED.receipt_date,
        amount = EXCLUDED.amount,
        contract_amount = EXCLUDED.contract_amount,
        ppn_amount = EXCLUDED.ppn_amount,
        pph_amount = EXCLUDED.pph_amount,
        description = EXCLUDED.description,
        status = 'draft',
        printed_at = NULL,
        printed_by = NULL,
        updated_at = NOW()
      `,
      [
        id,
        contractReceiptNumber,
        moment(paymentDate).format("YYYY-MM-DD"),
        amount,
        contractAmountValue,
        ppnAmountValue,
        `${paymentLabel} sewa kontrak ruangan atas nama ${tenantName}`,
        pphReceiptNumber,
        pphAmount,
        `Pajak PPH Psl 4(2) atas nama ${tenantName}`,
      ]
    );

    const paymentContext = await getPaymentNotificationContext(client, id);

    // Setelah bukti pembayaran diedit, status approval kembali pending.
    // Keuangan perlu mendapat notifikasi validasi ulang.
    if (paymentContext) {
      await notifyPaymentUpdated(client, paymentContext, uploadedBy);
    }

    // Commit sebelum operasi file
    await client.query("COMMIT");

    // === Setelah DB berhasil, baru proses file ===
    if (fileBuffer && newFilePath) {
      fs.writeFileSync(newFilePath, fileBuffer);

      // Hapus file lama (jika ada dan berbeda)
      if (
        oldFilePathToDelete &&
        oldFilePathToDelete.startsWith(uploadDir) &&
        fs.existsSync(oldFilePathToDelete)
      ) {
        try {
          fs.unlinkSync(oldFilePathToDelete);
        } catch (err) {
          console.error("Gagal hapus file lama:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data pembayaran berhasil diperbarui.",
        updated_id: id,
      }),
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error update payment:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params; // payment_id dari URL
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }

    await client.query("BEGIN");
    transactionOpen = true;

    // Ambil data payment
    const findPaymentQuery = `
      SELECT id, proof_file_path
      FROM payments
      WHERE id = $1
    `;
    const findPaymentResult = await client.query(findPaymentQuery, [id]);
    if (findPaymentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data pembayaran tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const payment = findPaymentResult.rows[0];
    const proofFilePath = payment.proof_file_path;
    const paymentContext = await getPaymentNotificationContext(client, id);

    if (paymentContext) {
      await notifyPaymentDeleted(client, paymentContext, authUser.id);
    }

    // Hapus data payment_approval
    const deleteApprovalQuery = `DELETE FROM payment_approval WHERE payment_id = $1`;
    await client.query(deleteApprovalQuery, [id]);

    // Hapus data payments
    const deletePaymentQuery = `DELETE FROM payments WHERE id = $1`;
    await client.query(deletePaymentQuery, [id]);

    await client.query("COMMIT");
    transactionOpen = false;

    // Hapus file bukti transfer jika ada
    if (proofFilePath) {
      const absolutePath = path.normalize(path.join(
        process.cwd(),
        proofFilePath.replace(/^\/+/, "")
      ));

      if (absolutePath.startsWith(uploadDir) && fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bukti pembayaran berhasil dihapus",
      }),
      { status: 200 }
    );
  } catch (err) {
    if (transactionOpen) {
      await client.query("ROLLBACK");
    }
    console.error("Error delete payment", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
