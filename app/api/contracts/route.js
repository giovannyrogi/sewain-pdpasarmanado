import pool from "@/lib/dbConfig";
import moment from "moment";
import { getAuthenticatedUser, requireRole, unauthorizedResponse } from "@/app/utils/auth";
import { notifyContractCreated } from "@/app/utils/notifications";

const CONTRACT_ACCESS_ROLES = [1, 2, 3, 4, 5, 6, 7];

export async function POST(req) {
  try {
    const { response: roleResponse } = await requireRole(CONTRACT_ACCESS_ROLES);
    if (roleResponse) return roleResponse;

    const body = await req.json();
    const { tenant_application_id, contract_number } = body;
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!tenant_application_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "tenant_application_id  wajib diisi",
        }),
        { status: 400 }
      );
    }

    if (!contract_number) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "contract_number wajib diisi",
        }),
        { status: 400 }
      );
    }

    // Ambil angka awal dari contract number sebelum simbol "/"
    const contractNumberPrefix = contract_number.split("/")[0].trim();

    // Cek apakah prefix angka sudah ada di database
    const checkContractNumber = await pool.query(
      `
        SELECT id 
        FROM contracts
        WHERE trim(split_part(contract_number, '/', 1)) = $1
      `,
      [contractNumberPrefix]
    );

    if (checkContractNumber.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Nomor kontrak ${contractNumberPrefix} sudah terdaftar!`,
        }),
        { status: 200 }
      );
    }

    // tanggal kontrak otomatis dari backend
    const contract_date = moment().format("YYYY-MM-DD");

    const insertQuery = `
      INSERT INTO contracts (tenant_application_id, contract_number, contract_date)
      VALUES ($1, $2, $3)
      RETURNING id, tenant_application_id, contract_number, contract_date, created_at, updated_at
    `;

    const values = [tenant_application_id, contract_number, contract_date];

    const result = await pool.query(insertQuery, values);
    const newContract = result.rows[0];

    const contractContext = await pool.query(
      `
      SELECT
        c.id AS contract_id,
        c.contract_number,
        c.tenant_application_id AS id,
        ta.user_id,
        ta.document_number,
        ti.full_name AS tenant_name,
        r.room_number,
        l.location_name
      FROM contracts c
      LEFT JOIN tenant_application ta ON ta.id = c.tenant_application_id
      LEFT JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
      LEFT JOIN rooms r ON r.id = ta.room_id
      LEFT JOIN locations l ON l.id = ta.location_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [newContract.id],
    );

    // Kontrak final tidak melibatkan bagian keuangan, sehingga notifikasi
    // dikirim ke role non-keuangan sesuai akses menu contracts.
    if (contractContext.rows[0]) {
      await notifyContractCreated(
        pool,
        contractContext.rows[0],
        authUser.id,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contract berhasil dibuat",
        data: newContract,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("error", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { response } = await requireRole(CONTRACT_ACCESS_ROLES);
    if (response) return response;

    const sql = `
      SELECT  
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
        ta.total_payment_room,
        ta.annual_room_rent,
        ta.lease_duration_years,
        ta.total_ppn,
        ta.admin_fee,

        -- tenant_identities
        ti.id AS tenant_identity_id,
        ti.full_name AS tenant_name,
        ti.nik AS tenant_nik,
        ti.phone AS tenant_phone,
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
        rm.id AS room_id,
        rm.room_number,
        rm.floor_id,
        rm.room_length,
        rm.room_width,
        rm.room_area,
        rm.price_per_m2,

        -- location floor prices
        lfp.id AS lfp_id,
        lfp.floor,

        -- location
        loc.id AS location_id,
        loc.location_name,
        loc.street_address,
        loc.city,
        loc.province,
        loc.district,
        loc.kelurahan,
        
        -- contracts
        c.id AS contract_id,
        c.contract_number,
        c.contract_date,
        c.created_at AS contract_created_at,
        c.updated_at AS contract_updated_at,

        -- payment approval
        pa.id AS payment_approval_id,
        pa.payment_id,
        pa.role_id AS payment_approval_role_id,
        pa.status AS payment_approval_status,
        pa.approver_id AS payment_approver_id,
        pa.notes AS payment_notes,
        pa.approved_at AS payment_approved_at,
        pa.created_at AS payment_approval_created_at,
        pa.updated_at AS payment_approval_updated_at

      FROM contracts c
      INNER JOIN tenant_application ta ON c.tenant_application_id = ta.id
      LEFT JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      LEFT JOIN rooms rm ON rm.id = ta.room_id
      LEFT JOIN locations loc ON loc.id = ta.location_id
      LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
      LEFT JOIN payments p ON p.tenant_application_id = ta.id
      LEFT JOIN payment_approval pa ON pa.payment_id = p.id

      WHERE ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL
        AND ta.is_fully_paid = true

      ORDER BY ta.created_at DESC
    `;

    const result = await pool.query(sql);

    // Group data per tenant_application_id
    const grouped = {};
    result.rows.forEach((row) => {
      if (!grouped[row.tenant_application_id]) {
        grouped[row.tenant_application_id] = {
          tenant_application: {
            id: row.tenant_application_id,
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
            updated_at: row.tenant_updated_at
              ? moment(row.tenant_updated_at).format("YYYY-MM-DD HH:mm:ss")
              : null,
            created_at: row.tenant_created_at
              ? moment(row.tenant_created_at).format("YYYY-MM-DD HH:mm:ss")
              : null,
            estimated_installment_1: row.estimated_installment_1,
            estimated_installment_2: row.estimated_installment_2,
            estimated_installment_3: row.estimated_installment_3,
            estimated_installment_1_date: row.estimated_installment_1_date,
            estimated_installment_2_date: row.estimated_installment_2_date,
            estimated_installment_3_date: row.estimated_installment_3_date,
            current_payment_step: row.current_payment_step,
            is_fully_paid: row.is_fully_paid,
            total_payment_room: row.total_payment_room,
            annual_room_rent: row.annual_room_rent,
            lease_duration_years: row.lease_duration_years,
            total_ppn: row.total_ppn,
            admin_fee: row.admin_fee,
          },
          tenant_identities: {
            id: row.tenant_identity_id,
            full_name: row.tenant_name,
            nik: row.tenant_nik,
            phone: row.tenant_phone,
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
            id: row.room_id,
            room_number: row.room_number,
            floor_id: row.floor_id,
            floor: row.floor,
            room_length: row.room_length,
            room_width: row.room_width,
            room_area: row.room_area,
            price_per_m2: row.price_per_m2,
          },
          location_floor_prices: {
            id: row.lfp_id,
            floor: row.floor,
          },
          locations: {
            id: row.location_id,
            location_name: row.location_name,
            street_address: row.street_address,
            city: row.city,
            province: row.province,
            district: row.district,
            kelurahan: row.kelurahan,
          },
          contracts: {
            id: row.contract_id,
            contract_number: row.contract_number,
            contract_date: row.contract_date,
            created_at: row.contract_created_at
              ? moment(row.contract_created_at).format("YYYY-MM-DD HH:mm:ss")
              : null,
            updated_at: row.contract_updated_at
              ? moment(row.contract_updated_at).format("YYYY-MM-DD HH:mm:ss")
              : null,
          },
          payment_approval: [],
        };
      }

      // Push multiple payment_approval jika ada lebih dari satu
      if (row.payment_approval_id) {
        grouped[row.tenant_application_id].payment_approval.push({
          id: row.payment_approval_id,
          payment_id: row.payment_id,
          role_id: row.payment_approval_role_id,
          status: row.payment_approval_status,
          approver_id: row.payment_approver_id,
          notes: row.payment_notes,
          approved_at: row.payment_approved_at,
          created_at: row.payment_approval_created_at,
          updated_at: row.payment_approval_updated_at,
        });
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data contracts",
        data: Object.values(grouped),
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
