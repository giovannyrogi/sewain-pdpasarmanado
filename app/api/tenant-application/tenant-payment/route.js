import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET() {
  try {
    const sql = `
    SELECT
    ta.id AS tenant_application_id,
    ta.tenant_name,
    ta.tenant_nik,
    ta.tenant_phone,
    ta.ktp_file_path,
    ta.start_date,
    ta.end_date,
    ta.payment_type,
    ta.total_payment,
    ta.down_payment,
    ta.remaining_payment,
    ta.approval_status,
    ta.current_step,
    ta.user_id,
    ta.updated_at,
    ta.created_at,
    ta.estimated_installment_1,
    ta.estimated_installment_2,
    ta.estimated_installment_3,
    ta.estimated_installment_1_date,
    ta.estimated_installment_2_date,
    ta.estimated_installment_3_date,
    ta.current_payment_step,
    rm.id AS room_id,
    rm.room_number,
    rm.floor_id,
    rm.room_length,
    rm.room_width,
    rm.room_area,
    rm.price_per_m2,
    lfp.floor,
    lfp.base_price,
    loc.location_name,
    loc.address AS location_address,
    loc.city AS location_city,
    p.id AS last_payment_id,
    p.payment_date AS last_payment_date,
    p.amount AS last_payment_amount,
    p.proof_file_path,
    p.payment_number AS last_payment_number
  FROM tenant_application ta
  LEFT JOIN rooms rm ON rm.id = ta.room_id
  LEFT JOIN locations loc ON loc.id = ta.location_id
  LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id

  -- Ambil hanya pembayaran terakhir yang APPROVED
  LEFT JOIN LATERAL (
      SELECT pp.*
      FROM payments pp
      WHERE pp.tenant_application_id = ta.id
        AND pp.approval_status = 'approved'
      ORDER BY pp.payment_number DESC
      LIMIT 1
  ) p ON TRUE

  -- Max cicilan APPROVED
  LEFT JOIN (
      SELECT tenant_application_id, MAX(payment_number) AS max_payment_number
      FROM payments
      WHERE approval_status = 'approved'
      GROUP BY tenant_application_id
  ) pm ON pm.tenant_application_id = ta.id

  -- Cek apakah ada payment dengan status PROSES (belum approved)
  LEFT JOIN (
      SELECT tenant_application_id, COUNT(*) AS cnt_proses
      FROM payments
      WHERE approval_status = 'proses'
      GROUP BY tenant_application_id
  ) px ON px.tenant_application_id = ta.id

  WHERE ta.approval_status = 'approved'
    AND ta.start_date IS NOT NULL
    AND ta.end_date IS NOT NULL
    AND ta.is_fully_paid = false
    AND COALESCE(px.cnt_proses,0) = 0 -- <== jangan tampil kalau ada payment 'proses'
    AND (
        -- LUNAS: hanya tampil kalau BELUM ada pembayaran apapun
        (ta.payment_type = 'lunas' AND p.id IS NULL)
        -- CICILAN: hanya tampil kalau cicilan belum terakhir
        OR (ta.payment_type = 'cicilan' AND (pm.max_payment_number < 3 OR pm.max_payment_number IS NULL))
    )
  ORDER BY ta.id;
    `;

    const result = await pool.query(sql);

    const rows = result.rows.map((row) => ({
      ...row,
      start_date: row.start_date
        ? moment(row.start_date).format("YYYY-MM-DD")
        : null,
      end_date: row.end_date ? moment(row.end_date).format("YYYY-MM-DD") : null,
      payment_date: row.payment_date
        ? moment(row.payment_date).format("YYYY-MM-DD")
        : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant application sesuai filter",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
