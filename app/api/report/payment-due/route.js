import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser } from "@/app/utils/auth";

const DUE_PAYMENT_DAYS = 30;

const toDateString = (value) => (value ? moment(value).format("YYYY-MM-DD") : null);

const getSafeDateRange = (request) => {
  const { searchParams } = new URL(request.url);
  const today = moment().startOf("day");
  const defaultStartDate = moment("2000-01-01");
  const defaultEndDate = today.clone().add(DUE_PAYMENT_DAYS, "days");
  const parsedStartDate = moment(searchParams.get("start_date"), "YYYY-MM-DD", true);
  const parsedEndDate = moment(searchParams.get("end_date"), "YYYY-MM-DD", true);
  const startDate = parsedStartDate.isValid() ? parsedStartDate : defaultStartDate;
  const endDate = parsedEndDate.isValid() ? parsedEndDate : defaultEndDate;

  if (startDate.isAfter(endDate)) {
    return {
      startDate: endDate.format("YYYY-MM-DD"),
      endDate: startDate.format("YYYY-MM-DD"),
    };
  }

  return {
    startDate: startDate.format("YYYY-MM-DD"),
    endDate: endDate.format("YYYY-MM-DD"),
  };
};

/**
 * Laporan jatuh tempo pembayaran memakai logika yang sama dengan dashboard,
 * tetapi tanpa limit per kategori. Bentuk response dibuat sama seperti
 * `/api/payments` agar modal detail lease bisa dipakai ulang tanpa adapter baru.
 */
export async function GET(request) {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;
    const { startDate, endDate } = getSafeDateRange(request);

    const sql = `
      WITH terminated AS (
        SELECT tenant_application_id
        FROM tenant_early_terminations
        WHERE approval_status = 'approved' AND is_terminated = true
      ),
      due_candidates AS (
        SELECT
          ta.id AS tenant_application_id,
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
          ta.document_number,

          ti.full_name AS tenant_name,
          ti.nik AS tenant_nik,
          ti.phone AS tenant_phone,
          ti.ktp_file_path,

          rm.id AS room_id,
          rm.room_number,
          rm.floor_id,
          rm.room_length,
          rm.room_width,
          rm.room_area,
          rm.price_per_m2,

          lfp.floor,

          loc.location_name,
          loc.street_address,
          loc.city,

          next_payment.next_payment_number,
          CASE
            WHEN ta.payment_type = 'lunas' THEN 'Pelunasan'
            WHEN next_payment.next_payment_number <= 1 THEN 'Uang Muka'
            ELSE CONCAT('Cicilan ', next_payment.next_payment_number - 1)
          END AS payment_step_label,
          CASE
            WHEN ta.payment_type = 'lunas' THEN ta.start_date
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number <= 2 THEN ta.estimated_installment_1_date
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number = 3 THEN ta.estimated_installment_2_date
            WHEN ta.payment_type = 'cicilan' AND next_payment.next_payment_number = 4 THEN ta.estimated_installment_3_date
            ELSE NULL
          END AS due_date,
          CASE
            WHEN ta.payment_type = 'lunas' THEN ta.total_payment
            WHEN next_payment.next_payment_number <= 1 THEN ta.down_payment
            WHEN next_payment.next_payment_number = 2 THEN ta.estimated_installment_1
            WHEN next_payment.next_payment_number = 3 THEN ta.estimated_installment_2
            WHEN next_payment.next_payment_number = 4 THEN ta.estimated_installment_3
            ELSE 0
          END AS due_amount
        FROM tenant_application ta
        JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        JOIN rooms rm ON rm.id = ta.room_id
        JOIN locations loc ON loc.id = ta.location_id
        LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
        LEFT JOIN terminated t ON t.tenant_application_id = ta.id
        LEFT JOIN LATERAL (
          SELECT COALESCE(MAX(p.payment_number), 0) + 1 AS next_payment_number
          FROM payments p
          WHERE p.tenant_application_id = ta.id
            AND p.approval_status = 'approved'
        ) next_payment ON TRUE
        WHERE ta.approval_status = 'approved'
          AND ta.payment_type IN ('cicilan', 'lunas')
          AND COALESCE(ta.is_fully_paid, false) = false
          AND t.tenant_application_id IS NULL
          AND (
            (ta.payment_type = 'lunas' AND next_payment.next_payment_number <= 1)
            OR (ta.payment_type = 'cicilan' AND next_payment.next_payment_number <= 4)
          )
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_application child
            WHERE child.renewal_of = ta.id
              AND child.approval_status = 'approved'
          )
          AND NOT EXISTS (
            SELECT 1
            FROM payments pending_payment
            WHERE pending_payment.tenant_application_id = ta.id
              AND pending_payment.approval_status IN ('proses', 'rejected')
          )
      ),
      classified AS (
        SELECT
          dc.*,
          (dc.due_date::date - CURRENT_DATE)::int AS days_remaining,
          CASE
            WHEN dc.due_date::date < CURRENT_DATE THEN 'overdue'
            ELSE 'dueSoon'
          END AS due_status
        FROM due_candidates dc
        WHERE dc.due_date IS NOT NULL
          AND dc.due_date::date BETWEEN $1::date AND $2::date
          AND (
            dc.due_date::date < CURRENT_DATE
            OR dc.due_date::date <= CURRENT_DATE + ($3::int * INTERVAL '1 day')
          )
      )
      SELECT
        c.*,
        COALESCE(previous.previous_payments, '[]'::json) AS previous_payments
      FROM classified c
      LEFT JOIN LATERAL (
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
        ) AS previous_payments
        FROM payments p2
        WHERE p2.tenant_application_id = c.tenant_application_id
          AND p2.approval_status = 'approved'
          AND p2.payment_number < c.next_payment_number
      ) previous ON TRUE
      ORDER BY
        CASE WHEN c.due_status = 'overdue' THEN 0 ELSE 1 END,
        CASE WHEN c.due_status = 'overdue' THEN c.due_date END DESC,
        CASE WHEN c.due_status = 'dueSoon' THEN c.due_date END ASC,
        c.tenant_application_id DESC
    `;

    const result = await pool.query(sql, [startDate, endDate, DUE_PAYMENT_DAYS]);

    const rows = result.rows.map((row) => {
      const paymentAmount = Number(row.due_amount || 0);
      const contractAmount = paymentAmount > 0 ? paymentAmount / 1.11 : 0;
      const ppnAmount = paymentAmount > 0 ? paymentAmount - contractAmount : 0;

      return {
        id: `${row.tenant_application_id}-${row.next_payment_number}`,
        tenant_application: {
          tenant_application_id: row.tenant_application_id,
          document_number: row.document_number,
          tenant_name: row.tenant_name,
          tenant_nik: row.tenant_nik,
          tenant_phone: row.tenant_phone,
          ktp_file_path: row.ktp_file_path,
          start_date: toDateString(row.start_date),
          end_date: toDateString(row.end_date),
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
          payment_id: null,
          payment_date: toDateString(row.due_date),
          payment_amount: paymentAmount,
          proof_file_path: null,
          payment_number: row.next_payment_number,
          approval_status: row.due_status,
          uploaded_by: null,
          ppn_amount: ppnAmount,
          contract_amount: contractAmount,
          remaining_balance: row.remaining_payment,
          previous_payments: row.previous_payments || [],
        },
        payment_due: {
          due_date: toDateString(row.due_date),
          due_status: row.due_status,
          days_remaining: row.days_remaining,
          payment_step_label: row.payment_step_label,
          next_payment_number: row.next_payment_number,
          due_amount: paymentAmount,
        },
        room: {
          room_id: row.room_id,
          room_number: row.room_number,
          floor_id: row.floor_id,
          room_length: row.room_length,
          room_width: row.room_width,
          room_area: row.room_area,
          price_per_m2: row.price_per_m2,
          floor: row.floor,
        },
        location: {
          location_name: row.location_name,
          street_address: row.street_address,
          city: row.city,
        },
      };
    });

    return Response.json({
      success: true,
      message: "Berhasil mengambil laporan jatuh tempo pembayaran.",
      data: rows,
      filters: {
        start_date: startDate,
        end_date: endDate,
      },
      summary: {
        total: rows.length,
        dueSoon: rows.filter((item) => item.payment_due?.due_status === "dueSoon")
          .length,
        overdue: rows.filter((item) => item.payment_due?.due_status === "overdue")
          .length,
      },
    });
  } catch (error) {
    console.error("Error fetching payment due report:", error);
    return Response.json(
      { success: false, message: "Gagal mengambil laporan jatuh tempo pembayaran." },
      { status: 500 },
    );
  }
}
