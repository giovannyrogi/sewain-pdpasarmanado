import pool from "@/lib/dbConfig";
import moment from "moment";


export async function GET(req) {
  try {
    // ambil role_id dari query string (misalnya ?role_id=3)
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("role_id");

    if (!roleId) {
      return new Response(
        JSON.stringify({ success: false, message: "role_id harus diisi" }),
        { status: 400 }
      );
    }

    const sql = `
      SELECT
        p.id AS payment_id,
        p.payment_date,
        p.amount AS payment_amount,
        p.proof_file_path,
        p.payment_number,
        p.approval_status AS payment_approval_status,
        p.uploaded_by,

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
        loc.city AS location_city

      FROM payments p
      LEFT JOIN tenant_application ta ON ta.id = p.tenant_application_id
      LEFT JOIN rooms rm ON rm.id = ta.room_id
      LEFT JOIN locations loc ON loc.id = ta.location_id
      LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
      -- filter berdasarkan role_id di tabel payment_approval
      INNER JOIN payment_approval pa ON pa.payment_id = p.id AND pa.role_id = $1
      WHERE ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL
      ORDER BY p.id;
    `;

    const result = await pool.query(sql, [roleId]);

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
        message: "Berhasil mengambil data payments",
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
