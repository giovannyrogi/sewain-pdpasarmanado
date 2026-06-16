import pool from "@/lib/dbConfig";
import path from "path";
import fs from "fs";
import moment from "moment";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  getPaymentNotificationContext,
  notifyPaymentSubmitted,
} from "@/app/utils/notifications";
import { calculatePaymentPphAmount } from "@/app/utils/calculatePphAmount";

// Konfigurasi upload folder
const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "bukti_transfer"
);
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

export async function POST(req) {
  const client = await pool.connect();
  try {
    const formData = await req.formData();
    const tenantApplicationId = formData.get("tenant_application_id");
    const amount = formData.get("amount");
    const paymentNumber = formData.get("payment_number") || 1;
    const paymentDate = formData.get("payment_date");
    const tenantName = formData.get("tenant_name") || "tenant";
    const proofFile = formData.get("proof_file");
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }
    const uploadedBy = authUser.id;
    const ppnAmount = formData.get("ppn_amount");
    const payment_type = formData.get("payment_type");
    const contract_amount = formData.get("contract_amount");

    // Backend menjadi sumber kebenaran untuk nilai kontrak. Khusus pembayaran
    // lunas, contract_amount wajib memakai total sewa ruangan sebelum PPN dan
    // iuran administrasi agar kwitansi PPH selalu punya dasar hitung yang benar.
    const tenantApplicationResult = await client.query(
      `
      SELECT payment_type, total_payment_room, total_ppn
      FROM tenant_application
      WHERE id = $1
      `,
      [tenantApplicationId]
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
    const paymentType = tenantApplication.payment_type || payment_type;
    const contractAmountValue =
      paymentType === "lunas"
        ? Number(tenantApplication.total_payment_room || 0)
        : Number(contract_amount) || Number(amount || 0) / 1.11;
    const ppnAmountValue =
      paymentType === "lunas"
        ? Number(tenantApplication.total_ppn || ppnAmount || 0)
        : Number(ppnAmount) || Number(amount || 0) - contractAmountValue;
    const pphAmountValue = calculatePaymentPphAmount({
      paymentType,
      paymentAmount: amount,
      contractAmount: contractAmountValue,
      totalPaymentRoom: contractAmountValue,
    });

    // Kondisi untuk remaining balance
    let remainingBalance = 0;
    if (paymentType === "cicilan") {
      remainingBalance = formData.get("remaining_balance") || 0;
    }

    if (!proofFile || typeof proofFile !== "object") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "File bukti transfer wajib diunggah",
        }),
        { status: 400 }
      );
    }

    if (proofFile.size > MAX_PROOF_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Ukuran file bukti pembayaran maksimal 5MB",
        }),
        { status: 400 }
      );
    }

    // --- Generate nama file saja (belum simpan file)
    const arrayBuffer = await proofFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
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

    const filename = `bukti_transfer_${sanitizeFilenamePart(tenantName)}_${moment().format("YYYY_MM_DD_HH_mm_ss")}${ext}`;
    const filePath = path.join(uploadDir, filename);
    const proofFilePath = `/uploads/bukti_transfer/${filename}`;

    // --- Transaksi supaya konsisten
    await client.query("BEGIN");

    // Insert ke table payments
    const insertPaymentQuery = `
      INSERT INTO payments 
        (tenant_application_id, payment_number, amount, payment_date, proof_file_path, uploaded_by, approval_status, ppn_amount, remaining_balance, contract_amount)
      VALUES ($1, $2, $3, $4, $5, $6, 'proses', $7, $8, $9)
      RETURNING id;
    `;

    const paymentValues = [
      tenantApplicationId,
      paymentNumber,
      amount,
      moment(paymentDate).format("YYYY-MM-DD"),
      proofFilePath,
      uploadedBy,
      ppnAmountValue,
      remainingBalance,
      contractAmountValue,
    ];

    const paymentResult = await client.query(insertPaymentQuery, paymentValues);
    const paymentId = paymentResult.rows[0].id;
    const paymentLabel = getPaymentLabel(paymentType, paymentNumber);
    const receiptYear = moment(paymentDate).format("YYYY");
    const receiptSequence = padReceiptNumber(paymentId);

    // Insert ke payment_approval otomatis
    const insertApprovalQuery = `
      INSERT INTO payment_approval (payment_id, role_id, step_order, status)
      VALUES ($1, 8, 1, 'pending')
      RETURNING id;
    `;
    await client.query(insertApprovalQuery, [paymentId]);

    const contractReceiptNumber = `PEN-${receiptYear}-${receiptSequence}`;
    const pphReceiptNumber = `PEM-${receiptYear}-${receiptSequence}`;
    const contractDescription = `${paymentLabel} sewa kontrak ruangan atas nama ${tenantName}`;
    const pphDescription = `Pajak PPH Psl 4(2) atas nama ${tenantName}`;

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
      ON CONFLICT (payment_id, receipt_type) DO NOTHING
      `,
      [
        paymentId,
        contractReceiptNumber,
        moment(paymentDate).format("YYYY-MM-DD"),
        amount,
        contractAmountValue,
        ppnAmountValue,
        contractDescription,
        pphReceiptNumber,
        pphAmountValue,
        pphDescription,
      ]
    );

    const paymentContext = await getPaymentNotificationContext(
      client,
      paymentId,
    );

    // Notifikasi pembayaran dibuat sebelum commit agar ikut rollback jika
    // pembuatan payment, approval, atau receipt gagal.
    if (paymentContext) {
      await notifyPaymentSubmitted(client, paymentContext, uploadedBy);
    }

    // --- Commit DB baru tulis file
    await client.query("COMMIT");

    // Simpan file setelah DB berhasil
    fs.writeFileSync(filePath, fileBuffer);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil upload bukti pembayaran, silahkan menunggu approval",
        payment_id: paymentId,
      }),
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error insert payment", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan saat menambahkan bukti pembayaran.",
      }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }

    const sql = `
      SELECT
        -- payments
        p.id AS payment_id,
        p.payment_date,
        p.amount AS payment_amount,
        p.proof_file_path,
        p.payment_number,
        p.approval_status,
        p.uploaded_by,
        p.ppn_amount,
        p.contract_amount,
        p.remaining_balance,
        receipts.receipts_json,

        -- Subquery: pembayaran sebelumnya
        (
          SELECT json_agg(
            json_build_object(
              'payment_id', p2.id,
              'payment_number', p2.payment_number,
              'amount', p2.amount,
              'ppn_amount', p2.ppn_amount,
              'contract_amount', p2.contract_amount,
              'remaining_balance', p2.remaining_balance,
              'payment_date', p2.payment_date,
              'proof_file_path', p2.proof_file_path
            )
            ORDER BY p2.payment_number
          )
          FROM payments p2
          WHERE p2.tenant_application_id = p.tenant_application_id
            AND p2.payment_number < p.payment_number
        ) AS previous_payments,

        -- tenant_application
        ta.id AS tenant_application_id,
        ta.document_number,
        ta.start_date,
        ta.end_date,
        ta.payment_type,
        ta.total_payment,
        ta.down_payment,
        ta.remaining_payment,
        ta.approval_status AS tenant_approval_status,
        ta.current_step,
        ta.user_id,
        ta.updated_at AS tenant_updated_at,
        ta.created_at AS tenant_created_at,
        ta.estimated_installment_1,
        ta.estimated_installment_2,
        ta.estimated_installment_3,
        ta.estimated_installment_1_date,
        ta.estimated_installment_2_date,
        ta.estimated_installment_3_date,   
        ta.current_payment_step,   
        ta.total_payment_room,
        ta.annual_room_rent,
        ta.lease_duration_years,
        ta.total_ppn,
        ta.admin_fee,
        latest_contract.contract_number,
        latest_contract.contract_date,

        -- tenant_identities 
        ti.full_name AS tenant_name,
        ti.nik AS tenant_nik,
        ti.phone AS tenant_phone,
        ti.ktp_file_path,

        -- rooms
        rm.id AS room_id,
        rm.room_number,
        rm.floor_id,
        rm.room_length,
        rm.room_width,
        rm.room_area,
        rm.price_per_m2,
        rm.price_type,

        -- location floor prices
        lfp.floor,

        -- location
        loc.location_name,
        loc.street_address,
        loc.city,

        -- payment approval
        pa.id,
        pa.payment_id,
        pa.role_id AS payment_approval_role_id,
        pa.status AS payment_approval_status2,
        pa.approver_id AS payment_approver_id,
        pa.notes AS payment_notes,
        pa.approved_at AS payment_approved_at,
        pa.created_at AS payment_approval_created_at,
        pa.updated_at AS payment_approval_updated_at

      FROM payments p
      LEFT JOIN tenant_application ta ON ta.id = p.tenant_application_id
      LEFT JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      LEFT JOIN rooms rm ON rm.id = ta.room_id
      LEFT JOIN locations loc ON loc.id = ta.location_id
      LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
      LEFT JOIN payment_approval pa ON pa.payment_id = p.id
      LEFT JOIN LATERAL (
        SELECT c.contract_number, c.contract_date
        FROM contracts c
        WHERE c.tenant_application_id = ta.id
        ORDER BY c.created_at DESC
        LIMIT 1
      ) latest_contract ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_object_agg(
          pr.receipt_type,
          json_build_object(
            'id', pr.id,
            'payment_id', pr.payment_id,
            'receipt_type', pr.receipt_type,
            'receipt_number', pr.receipt_number,
            'receipt_date', pr.receipt_date,
            'account_code', pr.account_code,
            'amount', pr.amount,
            'contract_amount', pr.contract_amount,
            'ppn_amount', pr.ppn_amount,
            'pph_amount', pr.pph_amount,
            'description', pr.description,
            'status', pr.status,
            'printed_at', pr.printed_at,
            'printed_by', pr.printed_by,
            'approved_at', pr.approved_at,
            'approved_by', pr.approved_by,
            'created_at', pr.created_at,
            'updated_at', pr.updated_at
          )
        ) AS receipts_json
        FROM payment_receipts pr
        WHERE pr.payment_id = p.id
      ) receipts ON TRUE
      WHERE ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL
      ORDER BY p.id;
    `;

    const result = await pool.query(sql);

    const rows = result.rows.map((row) => {
      return {
        tenant_application: {
          tenant_application_id: row.tenant_application_id,
          document_number: row.document_number,
          contract_number: row.contract_number,
          contract_date: row.contract_date
            ? moment(row.contract_date).format("YYYY-MM-DD")
            : null,
          tenant_name: row.tenant_name,
          tenant_nik: row.tenant_nik,
          tenant_phone: row.tenant_phone,
          ktp_file_path: row.ktp_file_path,
          start_date: row.start_date
            ? moment(row.start_date).format("YYYY-MM-DD")
            : null,
          end_date: row.end_date
            ? moment(row.end_date).format("YYYY-MM-DD")
            : null,
          payment_type: row.payment_type,
          total_payment: row.total_payment,
          down_payment: row.down_payment,
          remaining_payment: row.remaining_payment,
          approval_status: row.tenant_approval_status,
          current_step: row.current_step,
          user_id: row.user_id,
          updated_at: row.tenant_updated_at,
          created_at: row.tenant_created_at,
          estimated_installment_1: row.estimated_installment_1,
          estimated_installment_2: row.estimated_installment_2,
          estimated_installment_3: row.estimated_installment_3,
          estimated_installment_1_date: row.estimated_installment_1_date,
          estimated_installment_2_date: row.estimated_installment_2_date,
          estimated_installment_3_date: row.estimated_installment_3_date,
          current_payment_step: row.current_payment_step,
          total_payment_room: row.total_payment_room,
          annual_room_rent: row.annual_room_rent,
          lease_duration_years: row.lease_duration_years,
          total_ppn: row.total_ppn,
          admin_fee: row.admin_fee,
        },
        payments: {
          payment_id: row.payment_id,
          payment_date: row.payment_date
            ? moment(row.payment_date).format("YYYY-MM-DD")
            : null,
          payment_amount: row.payment_amount,
          proof_file_path: row.proof_file_path,
          payment_number: row.payment_number,
          approval_status: row.approval_status,
          uploaded_by: row.uploaded_by,
          ppn_amount: row.ppn_amount,
          contract_amount: row.contract_amount,
          remaining_balance: row.remaining_balance,
          previous_payments: row.previous_payments || [],
        },
        contracts: {
          contract_number: row.contract_number,
          contract_date: row.contract_date
            ? moment(row.contract_date).format("YYYY-MM-DD")
            : null,
        },
        receipts: row.receipts_json || {},
        payment_approval: {
          id: row.id,
          payment_id: row.payment_id,
          role_id: row.payment_approval_role_id,
          status: row.payment_approval_status2,
          approver_id: row.payment_approver_id,
          notes: row.payment_notes,
          approved_at: row.payment_approved_at
            ? moment(row.payment_approved_at).format("YYYY-MM-DD HH:mm:ss")
            : null,
          created_at: row.payment_approval_created_at,
          updated_at: row.payment_approval_updated_at,
        },
        room: {
          room_id: row.room_id,
          room_number: row.room_number,
          floor_id: row.floor_id,
          room_length: row.room_length,
          room_width: row.room_width,
          room_area: row.room_area,
          price_per_m2: row.price_per_m2,
          price_type: row.price_type,
          floor: row.floor,
        },
        location: {
          location_name: row.location_name,
          street_address: row.street_address,
          city: row.city,
        },
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data payments + approvals",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan saat mengambil data pembayaran.",
      }),
      { status: 500 }
    );
  }
}
