import pool from "@/lib/dbConfig";
import path from "path";
import fs from "fs";
import moment from "moment";

export async function GET() {
  try {
    const sql = `select  
		-- tenant_application
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
        ta.is_fully_paid,   

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

        -- location floor prices
        lfp.floor,
        lfp.base_price,
        -- location
        loc.location_name,
        loc.address,
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
	  FROM tenant_application ta
      LEFT JOIN payments p ON p.id = ta.id 
      LEFT JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      LEFT JOIN rooms rm ON rm.id = ta.room_id
      LEFT JOIN locations loc ON loc.id = ta.location_id
      LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
      LEFT JOIN payment_approval pa ON pa.payment_id = p.id
      WHERE ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT null
        and ta.is_fully_paid = true
      ORDER BY ta.created_at DESC`;

    const result = await pool.query(sql);
    const rows = result.rows.map((row) => ({
      ...row,
      created_at: row.created_at
        ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data ",
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
