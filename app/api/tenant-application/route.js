import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";

export async function POST(req) {
  try {
    const formData = await req.formData();

    // Ambil fields dari formData
    const location_id = formData.get("location_id");
    const room_id = formData.get("room_id");
    const tenant_identity_id = formData.get("tenant_identity_id");
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const payment_type = formData.get("payment_type");
    const total_payment = formData.get("total_payment");
    const total_ppn = formData.get("total_ppn");
    const down_payment = formData.get("down_payment");
    const remaining_payment = formData.get("remaining_payment");
    const approval_status = formData.get("approval_status");
    const user_id = formData.get("user_id");
    const current_step = formData.get("current_step");
    const renewal_of = formData.get("renewal_of");
    const estimated_installment_1 = formData.get("estimated_installment_1");
    const estimated_installment_2 = formData.get("estimated_installment_2");
    const estimated_installment_3 = formData.get("estimated_installment_3");
    const estimated_installment_1_date = formData.get(
      "estimated_installment_date_1"
    );
    const estimated_installment_2_date = formData.get(
      "estimated_installment_date_2"
    );
    const estimated_installment_3_date = formData.get(
      "estimated_installment_date_3"
    );
    const tenant_type = formData.get("tenant_type");
    const total_payment_room = formData.get("total_payment_room");
    const admin_fee = formData.get("admin_fee");

    const total = Number(total_payment) || 0;
    const minDp = Math.round(total * 0.4);
    const dp = Number(down_payment) || 0;

    // Validasi DP minimal 40% dari total
    if (payment_type === "cicilan" && dp < minDp) {
      return Response.json(
        { success: false, message: "DP minimal 40% dari total pembayaran." },
        { status: 400 }
      );
    }

    // Validasi DP tidak boleh lebih besar dari total
    if (dp > total) {
      return Response.json(
        {
          success: false,
          message: "DP tidak boleh lebih besar dari total pembayaran.",
        },
        { status: 400 }
      );
    }

    // Validasi wajib
    if (!location_id) {
      return Response.json(
        { success: false, message: "Lokasi wajib diisi." },
        { status: 400 }
      );
    }

    if (!room_id) {
      return Response.json(
        { success: false, message: "Ruangan wajib diisi." },
        { status: 400 }
      );
    }

    if (!tenant_identity_id) {
      return Response.json(
        { success: false, message: "Identitas wajib diisi." },
        { status: 400 }
      );
    }

    if (!total_payment) {
      return Response.json(
        { success: false, message: "Total pembayaran wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi room + lokasi
    const roomCheck = await pool.query(
      "SELECT * FROM rooms WHERE id = $1 AND location_id = $2",
      [room_id, location_id]
    );
    if (roomCheck.rowCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Ruangan tidak ditemukan di lokasi yang dipilih.",
        },
        { status: 400 }
      );
    }

    // Normalisasi nilai numeric
    const total_payment_num = total_payment ? Number(total_payment) : 0;
    const down_payment_num = down_payment ? Number(down_payment) : 0;
    const remaining_payment_num = remaining_payment
      ? Number(remaining_payment)
      : 0;

    // Insert ke database
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        INSERT INTO tenant_application (
          location_id,
          room_id,
          tenant_identity_id,
          payment_type,
          total_payment,
          down_payment,
          remaining_payment,
          approval_status,
          user_id,
          current_step,
          estimated_installment_1,
          estimated_installment_2,
          estimated_installment_3,
          estimated_installment_1_date,
          estimated_installment_2_date,
          estimated_installment_3_date,
          renewal_of,
          start_date,
          end_date,
          total_payment_room,
          admin_fee,
          total_ppn
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING *
        `,
        [
          location_id,
          room_id,
          tenant_identity_id,
          payment_type,
          total_payment_num,
          down_payment_num,
          remaining_payment_num,
          approval_status,
          user_id,
          current_step,
          estimated_installment_1,
          estimated_installment_2,
          estimated_installment_3,
          estimated_installment_1_date,
          estimated_installment_2_date,
          estimated_installment_3_date,
          renewal_of,
          start_date,
          end_date,
          total_payment_room,
          admin_fee,
          total_ppn,
        ]
      );

      // Ambil tenant_application_id hasil insert
      const tenantApp = result.rows[0];
      const tenantAppId = tenantApp.id;

      // Insert ke tenant_approval sesuai urutan step role
      const approvals = [
        { role_id: 3, step_order: 1 }, // kasie
        { role_id: 4, step_order: 2 }, // kasubdiv
        { role_id: 5, step_order: 3 }, // kadiv
        { role_id: 6, step_order: 4 }, // dirbis
        { role_id: 7, step_order: 5 }, // dirut
      ];

      for (const a of approvals) {
        await client.query(
          `INSERT INTO tenant_approval (
          tenant_application_id,
          role_id,
          step_order,
          status
        ) VALUES ($1, $2, $3, $4)`,
          [tenantAppId, a.role_id, a.step_order, "pending"]
        );
      }

      // Ambil nama tenant dari tabel tenant_identities
      const tenantIdentity = await client.query(
        `SELECT full_name FROM tenant_identities WHERE id = $1`,
        [tenant_identity_id]
      );

      const tenantName = tenantIdentity.rows[0]?.full_name || "-";

      // Format notes
      const notes =
        start_date && end_date
          ? `Ruangan ini sedang digunakan oleh ${tenantName} mulai ${start_date} s/d ${end_date}`
          : `Ruangan ini sedang digunakan oleh ${tenantName}`;

      // Update rooms → set status = 'occupied' dan occupied_by = tenantAppId
      await client.query(
        `
        UPDATE rooms 
        SET status = 'occupied',
            occupied_by = $2,
            notes = $3
        WHERE id = $1
        `,
        [room_id, tenantAppId, notes]
      );

      // Jika semua sukses → commit
      await client.query("COMMIT");

      return Response.json(
        {
          success: true,
          message: "Permohonan berhasil ditambahkan.",
          data: result.rows[0],
        },
        { status: 201 }
      );
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error upload/insert:", err);
    return Response.json(
      { success: false, message: "Terjadi error: " + err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const result = await pool.query(
      `SELECT
        ta.id AS tenant_application_id,
        ta.tenant_identity_id,
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
        ta.document_number,
        ta.renewal_of,
        ta.is_fully_paid,
        ta.admin_fee,
        ta.total_payment_room,
        ta.total_ppn,

        -- identitas penyewa saat ini
        ti.full_name AS tenant_name,
        ti.nik AS tenant_nik,
        ti.phone AS tenant_phone,
        ti.ktp_file_path AS ktp_file_path,

        -- lokasi & ruangan
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
        f.floor,

        -- data tenant sebelumnya (1 level back)
        prev.id AS old_tenant_id,
        prev.document_number AS old_document_number,
        prev.start_date AS old_start_date,
        prev.end_date AS old_end_date,
        pti.full_name AS old_tenant_name,
        pti.nik AS old_tenant_nik,
        pti.phone AS old_tenant_phone,
        pti.ktp_file_path AS old_ktp_file_path

      FROM tenant_application ta
      JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      JOIN rooms r ON ta.room_id = r.id
      JOIN locations l ON ta.location_id = l.id
      LEFT JOIN location_floor_prices f ON r.floor_id = f.id
      LEFT JOIN tenant_early_terminations tet ON tet.tenant_application_id = ta.id
      LEFT JOIN tenant_application prev ON ta.renewal_of = prev.id
      LEFT JOIN tenant_identities pti ON prev.tenant_identity_id = pti.id
      WHERE tet.is_terminated = false
         OR tet.is_terminated IS NULL
      ORDER BY ta.created_at DESC`
    );

    const rows = result.rows.map((row) => ({
      tenant_application_id: row.tenant_application_id,
      tenant_identity_id: row.tenant_identity_id,
      user_id: row.user_id,
      tenant_name: row.tenant_name,
      tenant_nik: row.tenant_nik,
      tenant_phone: row.tenant_phone,
      ktp_file_path: row.ktp_file_path,
      start_date: row.start_date,
      end_date: row.end_date,
      estimated_installment_1: row.estimated_installment_1,
      estimated_installment_2: row.estimated_installment_2,
      estimated_installment_3: row.estimated_installment_3,
      estimated_installment_1_date: row.estimated_installment_1_date,
      estimated_installment_2_date: row.estimated_installment_2_date,
      estimated_installment_3_date: row.estimated_installment_3_date,
      document_number: row.document_number,
      payment_type: row.payment_type,
      total_payment: row.total_payment,
      down_payment: row.down_payment,
      admin_fee: row.admin_fee,
      total_payment_room: row.total_payment_room,
      total_ppn: row.total_ppn,
      remaining_payment: row.remaining_payment,
      approval_status: row.approval_status,
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
      is_fully_paid: row.is_fully_paid ?? false,
      created_at: moment(row.created_at).format("D MMMM YYYY"),
      old_tenant: row.old_tenant_id
        ? {
            tenant_application_id: row.old_tenant_id,
            tenant_name: row.old_tenant_name,
            tenant_nik: row.old_tenant_nik,
            tenant_phone: row.old_tenant_phone,
            ktp_file_path: row.old_ktp_file_path,
            start_date: row.old_start_date,
            end_date: row.old_end_date,
            document_number: row.old_document_number,
          }
        : null,
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
