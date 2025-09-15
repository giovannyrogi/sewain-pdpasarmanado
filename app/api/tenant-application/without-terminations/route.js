import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(req) {
  try {
    const result = await pool.query(
      `
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
        l.id AS location_id,
        l.location_name,
        r.id AS room_id,
        r.room_number,
        r.floor_id,
        r.room_length,
        r.room_width,
        r.price_per_m2,
        r.room_area,
        f.base_price,
        f.floor
      FROM tenant_application ta
      JOIN rooms r ON ta.room_id = r.id
      JOIN locations l ON ta.location_id = l.id
      LEFT JOIN location_floor_prices f ON r.floor_id = f.id
      LEFT JOIN tenant_early_terminations tet 
          ON ta.id = tet.tenant_application_id
      WHERE tet.tenant_application_id IS NULL
      AND ta.approval_status = 'approved'
      ORDER BY ta.created_at DESC
      `
    );

    const rows = result.rows.map((row) => ({
      tenant_application_id: row.tenant_application_id,
      user_id: row.user_id,
      tenant_name: row.tenant_name,
      tenant_nik: row.tenant_nik,
      tenant_phone: row.tenant_phone,
      ktp_file_path: row.ktp_file_path,
      start_date: row.start_date,
      end_date: row.end_date,
      payment_type: row.payment_type,
      total_payment: row.total_payment,
      down_payment: row.down_payment,
      remaining_payment: row.remaining_payment,
      approval_status: row.approval_status,
      estimated_installment_1: row.estimated_installment_1,
      estimated_installment_2: row.estimated_installment_2,
      estimated_installment_3: row.estimated_installment_3,
      estimated_installment_1_date: row.estimated_installment_1_date,
      estimated_installment_2_date: row.estimated_installment_2_date,
      estimated_installment_3_date: row.estimated_installment_3_date,
      location_id: row.location_id,
      location_name: row.location_name,
      room_id: row.room_id,
      room_number: row.room_number,
      floor_id: row.floor_id,
      room_length: row.room_length,
      room_width: row.room_width,
      room_area: row.room_area,
      price_per_m2: row.price_per_m2,
      current_step: row.current_step,
      base_price: row.base_price,
      floor: row.floor,
      created_at: moment(row.created_at).format("D MMMM YYYY"),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant application",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error", err);

    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
