import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireRole } from "@/app/utils/auth";

const CONTRACT_ACCESS_ROLES = [1, 2];

export async function GET() {
  try {
    const { response } = await requireRole(CONTRACT_ACCESS_ROLES);
    if (response) return response;

    const sql = `
      WITH max_contract AS (
        SELECT c.id, c.contract_number,
               CAST(NULLIF(regexp_replace(c.contract_number, '^([0-9]+).*$', '\\1'), '') AS INT) AS contract_num_only
        FROM contracts c
        WHERE c.contract_number ~ '^[0-9]+'
        ORDER BY contract_num_only DESC
        LIMIT 1
      )
      SELECT 
        -- tenant_application
        ta.id AS tenant_application_id,
        ta.tenant_identity_id,
        ta.room_id,
        ta.location_id,
        ta.start_date,
        ta.end_date,
        ta.payment_type,
        ta.total_payment,
        ta.total_payment_room,
        ta.annual_room_rent,
        ta.lease_duration_years,
        ta.total_ppn,
        ta.admin_fee,
        ta.down_payment,
        ta.remaining_payment,
        ta.approval_status,
        ta.current_step,
        ta.user_id,
        ta.updated_at AS tenant_updated_at,
        ta.created_at AS tenant_created_at,
        ta.is_fully_paid,
        ta.renewal_of,

        -- tenant_identities
        ti.id AS tenant_identity_id2,
        ti.full_name,
        ti.nik,
        ti.phone,
        ti.ktp_file_path,
        ti.birth_place,
        ti.birth_date,
        ti.nationality,
        ti.religion,
        ti.occupation,
        ti.street_address,
        ti.rt,
        ti.rw,
        ti.kelurahan,
        ti.district,
        ti.city,
        ti.province,
        ti.status,
        ti.notes,

        -- rooms
        rm.id AS room_id2,
        rm.room_number,
        rm.floor_id,
        rm.room_length,
        rm.room_width,
        rm.room_area,
        rm.price_per_m2,

        -- locations
        loc.id AS location_id2,
        loc.location_name,
        loc.street_address,
        loc.city,
        loc.location_code,
        loc.province,
        loc.postal_code,
        loc.district,
        loc.kelurahan,

        -- contracts (ambil nomor kontrak terbesar)
        mc.contract_number AS latest_contract_number,
        mc.contract_num_only AS latest_contract_number_only,

       -- tetap tampilkan nomor kontrak terbesar
        mc.contract_number AS latest_contract_number,
        mc.contract_num_only AS latest_contract_number_only

      FROM tenant_application ta
      LEFT JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      LEFT JOIN rooms rm ON rm.id = ta.room_id
      LEFT JOIN locations loc ON loc.id = ta.location_id
      LEFT JOIN max_contract mc ON TRUE

      WHERE 
        ta.is_fully_paid = TRUE
        AND ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL

        -- hanya tampilkan kontrak terakhir (belum diperpanjang lagi)
        AND NOT EXISTS (
          SELECT 1 
          FROM tenant_application next_app 
          WHERE next_app.renewal_of = ta.id
        )

        -- belum dibuatkan kontrak di tabel contracts
        AND NOT EXISTS (
          SELECT 1 
          FROM contracts c 
          WHERE c.tenant_application_id = ta.id
        )

        -- belum pernah dinonaktifkan (terminated)
        AND NOT EXISTS (
          SELECT 1
          FROM tenant_early_terminations tet
          WHERE tet.tenant_application_id = ta.id
            AND tet.is_terminated = TRUE
        )

      ORDER BY ta.created_at DESC;
    `;

    const result = await pool.query(sql);

    const data = result.rows.map((row) => ({
      tenant_application: {
        id: row.tenant_application_id,
        tenant_identity_id: row.tenant_identity_id,
        room_id: row.room_id,
        location_id: row.location_id,
        start_date: row.start_date
          ? moment(row.start_date).format("YYYY-MM-DD")
          : null,
        end_date: row.end_date
          ? moment(row.end_date).format("YYYY-MM-DD")
          : null,
        payment_type: row.payment_type,
        total_payment: row.total_payment,
        total_payment_room: row.total_payment_room,
        annual_room_rent: row.annual_room_rent,
        lease_duration_years: row.lease_duration_years,
        total_ppn: row.total_ppn,
        admin_fee: row.admin_fee,
        down_payment: row.down_payment,
        remaining_payment: row.remaining_payment,
        approval_status: row.approval_status,
        current_step: row.current_step,
        user_id: row.user_id,
        is_fully_paid: row.is_fully_paid,
        renewal_of: row.renewal_of,
        created_at: row.tenant_created_at
          ? moment(row.tenant_created_at).format("YYYY-MM-DD HH:mm:ss")
          : null,
        updated_at: row.tenant_updated_at
          ? moment(row.tenant_updated_at).format("YYYY-MM-DD HH:mm:ss")
          : null,
      },
      tenant_identities: {
        id: row.tenant_identity_id2,
        full_name: row.full_name,
        nik: row.nik,
        phone: row.phone,
        ktp_file_path: row.ktp_file_path,
        birth_place: row.birth_place,
        birth_date: row.birth_date,
        nationality: row.nationality,
        religion: row.religion,
        occupation: row.occupation,
        street_address: row.street_address,
        rt: row.rt,
        rw: row.rw,
        kelurahan: row.kelurahan,
        district: row.district,
        city: row.city,
        province: row.province,
        status: row.status,
        notes: row.notes,
      },
      rooms: {
        id: row.room_id2,
        room_number: row.room_number,
        floor_id: row.floor_id,
        room_length: row.room_length,
        room_width: row.room_width,
        room_area: row.room_area,
        price_per_m2: row.price_per_m2,
      },
      locations: {
        id: row.location_id2,
        location_name: row.location_name,
        street_address: row.street_address,
        city: row.city,
        location_code: row.location_code,
        province: row.province,
        postal_code: row.postal_code,
        district: row.district,
        kelurahan: row.kelurahan,
      },
      contracts: {
        latest_contract_number: row.latest_contract_number,
        latest_contract_number_only: row.latest_contract_number_only,
      },
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil daftar tenant",
        data,
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
