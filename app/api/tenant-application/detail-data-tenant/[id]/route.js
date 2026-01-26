// import pool from "@/lib/dbConfig";
// import moment from "moment";

// export async function GET(req, { params }) {
//   const { id } = await params;

//   if (!id) {
//     return Response.json(
//       { success: false, message: "ID tidak valid" },
//       { status: 200 },
//     );
//   }

//   try {
//     const result = await pool.query(
//       `SELECT
//         ta.id AS tenant_application_id,
//         ta.tenant_identity_id,
//         ta.start_date,
//         ta.end_date,
//         ta.payment_type,
//         ta.total_payment,
//         ta.down_payment,
//         ta.remaining_payment,
//         ta.approval_status,
//         ta.current_step,
//         ta.user_id,
//         ta.updated_at,
//         ta.created_at,
//         ta.estimated_installment_1,
//         ta.estimated_installment_2,
//         ta.estimated_installment_3,
//         ta.estimated_installment_1_date,
//         ta.estimated_installment_2_date,
//         ta.estimated_installment_3_date,
//         ta.document_number,
//         ta.renewal_of,
//         ta.is_fully_paid,
//         ta.admin_fee,
//         ta.total_payment_room,
//         ta.total_ppn,
//         ta.current_tenor,

//         -- identitas penyewa saat ini
//         ti.full_name AS tenant_name,
//         ti.nik AS tenant_nik,
//         ti.phone AS tenant_phone,
//         ti.ktp_file_path AS ktp_file_path,

//         -- lokasi & ruangan
//         l.id AS location_id,
//         l.location_name,
//         r.id AS room_id,
//         r.room_number,
//         r.floor_id,
//         r.room_length,
//         r.room_width,
//         r.price_per_m2,
//         r.room_area,
//         f.floor

//       FROM tenant_application ta
//       JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
//       JOIN rooms r ON ta.room_id = r.id
//       JOIN locations l ON ta.location_id = l.id
//       LEFT JOIN location_floor_prices f ON r.floor_id = f.id
//       LEFT JOIN tenant_early_terminations tet ON tet.tenant_application_id = ta.id
//       WHERE ta.id = $1
//       AND (tet.is_terminated = false OR tet.is_terminated IS NULL)
//       ORDER BY ta.created_at DESC`,
//       [id],
//     );

//     const rows = result.rows.map((row) => ({
//       tenant_application_id: row.tenant_application_id,
//       tenant_identity_id: row.tenant_identity_id,
//       user_id: row.user_id,
//       current_tenor: row.current_tenor,
//       tenant_name: row.tenant_name,
//       tenant_nik: row.tenant_nik,
//       tenant_phone: row.tenant_phone,
//       ktp_file_path: row.ktp_file_path,
//       start_date: row.start_date,
//       end_date: row.end_date,
//       estimated_installment_1: row.estimated_installment_1,
//       estimated_installment_2: row.estimated_installment_2,
//       estimated_installment_3: row.estimated_installment_3,
//       estimated_installment_1_date: row.estimated_installment_1_date,
//       estimated_installment_2_date: row.estimated_installment_2_date,
//       estimated_installment_3_date: row.estimated_installment_3_date,
//       document_number: row.document_number,
//       payment_type: row.payment_type,
//       total_payment: row.total_payment,
//       down_payment: row.down_payment,
//       admin_fee: row.admin_fee,
//       total_payment_room: row.total_payment_room,
//       total_ppn: row.total_ppn,
//       remaining_payment: row.remaining_payment,
//       approval_status: row.approval_status,
//       location_id: row.location_id,
//       location_name: row.location_name,
//       room_id: row.room_id,
//       room_number: row.room_number,
//       floor_id: row.floor_id,
//       room_length: row.room_length,
//       room_width: row.room_width,
//       room_area: row.room_area,
//       price_per_m2: row.price_per_m2,
//       current_step: row.current_step,
//       floor: row.floor,
//       is_fully_paid: row.is_fully_paid ?? false,
//       created_at: moment(row.created_at).format("D MMMM YYYY"),
//     }));

//     if (rows.length === 0) {
//       return new Response(
//         JSON.stringify({ success: false, message: "Data tidak ditemukan" }),
//         { status: 200 },
//       );
//     }

//     return new Response(
//       JSON.stringify({
//         success: true,
//         message: "Berhasil mengambil detail data tenant",
//         data: rows[0],
//       }),
//       { status: 200 },
//     );
//   } catch (err) {
//     console.log("error", err);

//     return new Response(
//       JSON.stringify({ success: false, message: err.message }),
//       { status: 500 },
//     );
//   }
// }
