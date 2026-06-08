import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  notifyTenantApplicationDeleted,
  notifyTenantApplicationUpdated,
} from "@/app/utils/notifications";
import { calculateAllPayments } from "@/app/utils/calculateAllPayments";
import { calculateLeaseEndDate, normalizeLeaseDurationYears } from "@/app/utils/calculateRoomRent";

const isMoneyEqual = (left, right) =>
  Math.abs(Number(left || 0) - Number(right || 0)) < 1;

export async function PUT(req, { params }) {
  const { id } = await params;

  try {
    const formData = await req.formData();

    // Ambil fields
    const location_id = formData.get("location_id");
    const room_id = formData.get("room_id");
    const tenant_identity_id = formData.get("tenant_identity_id");
    const payment_type = formData.get("payment_type");
    const total_payment = formData.get("total_payment");
    const down_payment = formData.get("down_payment");
    const remaining_payment = formData.get("remaining_payment");
    const approval_status = formData.get("approval_status");
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }
    const user_id = authUser.id;
    const estimated_installment_1 = formData.get("estimated_installment_1");
    const estimated_installment_2 = formData.get("estimated_installment_2");
    const estimated_installment_3 = formData.get("estimated_installment_3");
    const estimated_installment_1_date = formData.get(
      "estimated_installment_date_1",
    );
    const estimated_installment_2_date = formData.get(
      "estimated_installment_date_2",
    );
    const estimated_installment_3_date = formData.get(
      "estimated_installment_date_3",
    );
    const choose_tenor = Number(formData.get("choose_tenor")) || 1;
    const total_payment_room = formData.get("total_payment_room");
    const annual_room_rent = formData.get("annual_room_rent");
    const lease_duration_years = normalizeLeaseDurationYears(
      formData.get("lease_duration_years"),
    );
    const total_ppn = formData.get("total_ppn");
    const admin_fee = formData.get("admin_fee");
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const tenant_type = formData.get("tenant_type");
    const document_number = formData.get("document_number");

    // Validasi wajib
    if (!location_id) {
      return Response.json(
        { success: false, message: "Lokasi wajib diisi." },
        { status: 400 },
      );
    }

    if (!room_id) {
      return Response.json(
        { success: false, message: "Ruangan wajib diisi." },
        { status: 400 },
      );
    }

    if (!tenant_identity_id) {
      return Response.json(
        { success: false, message: "Identitas wajib diisi." },
        { status: 400 },
      );
    }

    if (!total_payment) {
      return Response.json(
        { success: false, message: "Total pembayaran wajib diisi." },
        { status: 400 },
      );
    }

    if (!start_date) {
      return Response.json(
        { success: false, message: "Tanggal mulai kontrak wajib diisi." },
        { status: 400 },
      );
    }

    if (!end_date) {
      return Response.json(
        { success: false, message: "Tanggal akhir kontrak wajib diisi." },
        { status: 400 },
      );
    }

    //check document number duplication when edit data but still can use the same document number
    const checkDocumentNumber = await pool.query(
      "SELECT 1 FROM tenant_application WHERE document_number = $1 AND id != $2",
      [document_number, id],
    );
    if (checkDocumentNumber.rows.length > 0) {
      return Response.json(
        {
          success: false,
          message: "Nomor dokumen sudah terdaftar!",
        },
        { status: 200 },
      );
    }

    // Ambil data lama tenant
    const oldDataRes = await pool.query(
      "SELECT * FROM tenant_application WHERE id = $1",
      [id],
    );
    if (oldDataRes.rowCount === 0) {
      return Response.json(
        { success: false, message: "Data tidak ditemukan" },
        { status: 200 },
      );
    }
    const oldData = oldDataRes.rows[0];
    const oldRoomId = oldData.room_id;

    // Kalau current_step tidak dikirim, gunakan yang lama
    const stepToUse = oldData.current_step;

    // Validasi room + lokasi
    const roomCheck = await pool.query(
      "SELECT * FROM rooms WHERE id = $1 AND location_id = $2",
      [room_id, location_id],
    );
    if (roomCheck.rowCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Ruangan tidak ditemukan di lokasi yang dipilih.",
        },
        { status: 400 },
      );
    }

    const calculatedEndDate = calculateLeaseEndDate(
      moment(start_date).toDate(),
      lease_duration_years,
    );
    const normalizedEndDate = calculatedEndDate?.format("YYYY-MM-DD");

    if (normalizedEndDate !== moment(end_date).format("YYYY-MM-DD")) {
      return Response.json(
        {
          success: false,
          message:
            "Tanggal akhir kontrak tidak sesuai dengan durasi sewa yang dipilih.",
        },
        { status: 400 },
      );
    }

    const paymentCalculation = calculateAllPayments({
      room: roomCheck.rows[0],
      leaseDurationYears: lease_duration_years,
      paymentType: payment_type,
      downPayment: Number(down_payment || 0),
      chooseTenor: choose_tenor,
      adminFee: Number(admin_fee || 0),
    });

    if (
      !isMoneyEqual(total_payment, paymentCalculation.totalPayment) ||
      !isMoneyEqual(total_payment_room, paymentCalculation.totalSewa) ||
      !isMoneyEqual(total_ppn, paymentCalculation.totalPPN) ||
      !isMoneyEqual(annual_room_rent, paymentCalculation.annualRoomRent)
    ) {
      return Response.json(
        {
          success: false,
          message: "Total pembayaran tidak sesuai dengan kalkulasi sistem.",
        },
        { status: 400 },
      );
    }

    const minDp = Math.round(paymentCalculation.totalPayment * 0.4);
    const dp = Number(down_payment) || 0;

    if (payment_type === "cicilan" && dp < minDp) {
      return Response.json(
        { success: false, message: "DP minimal 40% dari total pembayaran." },
        { status: 400 },
      );
    }

    if (dp > paymentCalculation.totalPayment) {
      return Response.json(
        {
          success: false,
          message: "DP tidak boleh lebih besar dari total pembayaran.",
        },
        { status: 400 },
      );
    }

    if (payment_type === "cicilan") {
      const cicilan = [
        Number(estimated_installment_1) || 0,
        Number(estimated_installment_2) || 0,
        Number(estimated_installment_3) || 0,
      ];

      const usedCicilan = cicilan.slice(0, choose_tenor);
      const totalCicilan = usedCicilan.reduce((a, b) => a + b, 0);

      if (totalCicilan !== Number(remaining_payment)) {
        return Response.json(
          {
            success: false,
            message: "Total cicilan tidak sesuai dengan sisa pembayaran.",
          },
          { status: 200 },
        );
      }
    }

    let formated_estimated_installment_1 = null;
    let formated_estimated_installment_2 = null;
    let formated_estimated_installment_3 = null;
    let formated_estimated_installment_1_date = null;
    let formated_estimated_installment_2_date = null;
    let formated_estimated_installment_3_date = null;

    if (choose_tenor === 1) {
      formated_estimated_installment_1 = estimated_installment_1;
      formated_estimated_installment_1_date = estimated_installment_1_date;
    } else if (choose_tenor === 2) {
      formated_estimated_installment_1 = estimated_installment_1;
      formated_estimated_installment_2 = estimated_installment_2;
      formated_estimated_installment_1_date = estimated_installment_1_date;
      formated_estimated_installment_2_date = estimated_installment_2_date;
    } else if (choose_tenor === 3) {
      formated_estimated_installment_1 = estimated_installment_1;
      formated_estimated_installment_2 = estimated_installment_2;
      formated_estimated_installment_3 = estimated_installment_3;
      formated_estimated_installment_1_date = estimated_installment_1_date;
      formated_estimated_installment_2_date = estimated_installment_2_date;
      formated_estimated_installment_3_date = estimated_installment_3_date;
    }

    // Normalisasi angka
    const total_payment_num = total_payment ? Number(total_payment) : 0;
    const down_payment_num = down_payment ? Number(down_payment) : 0;
    const remaining_payment_num = remaining_payment
      ? Number(remaining_payment)
      : 0;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        UPDATE tenant_application
        SET
        location_id = $1,
        room_id = $2,
        tenant_identity_id = $3,
        payment_type = $4,
        total_payment = $5,
        down_payment = $6,
        remaining_payment = $7,
        approval_status = $8,
        current_step = $9,
        user_id = $10,
        estimated_installment_1 = $11,
        estimated_installment_2 = $12,
        estimated_installment_3 = $13,
        estimated_installment_1_date = $14,
        estimated_installment_2_date = $15,
        estimated_installment_3_date = $16,
        total_payment_room = $17,
        current_tenor = $18,
        start_date = $19,
        end_date = $20,
        document_number = $21,
        application_type = $22,
        annual_room_rent = $23,
        lease_duration_years = $24,
        total_ppn = $25,
        admin_fee = $26
        WHERE id = $27
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
          stepToUse,
          user_id,
          formated_estimated_installment_1,
          formated_estimated_installment_2,
          formated_estimated_installment_3,
          formated_estimated_installment_1_date,
          formated_estimated_installment_2_date,
          formated_estimated_installment_3_date,
          total_payment_room,
          choose_tenor,
          start_date,
          end_date,
          document_number,
          tenant_type,
          annual_room_rent,
          lease_duration_years,
          total_ppn,
          admin_fee,
          id,
        ],
      );

      const tenantApp = result.rows[0];

      // Ambil nama tenant dari tabel tenant_identities
      const tenantIdentity = await client.query(
        `SELECT full_name FROM tenant_identities WHERE id = $1`,
        [tenant_identity_id],
      );
      const locationResult = await client.query(
        `SELECT location_name FROM locations WHERE id = $1`,
        [location_id],
      );
      const tenantName = tenantIdentity.rows[0]?.full_name || "-";
      const locationName = locationResult.rows[0]?.location_name || "-";

      // Format catatan/notes
      const notes = `Ruangan ini sedang digunakan oleh ${tenantName}`;

      // Jika ruangan berubah → perbarui status
      if (oldRoomId !== room_id) {
        // Ruangan lama jadi available kembali
        await client.query(
          `
          UPDATE rooms 
          SET status = 'available',
              notes = NULL
          WHERE id = $1
          `,
          [oldRoomId],
        );
      }

      // Ruangan baru diupdate jadi digunakan
      await client.query(
        `
        UPDATE rooms 
        SET status = 'occupied',
            notes = $2
        WHERE id = $1
        `,
        [room_id, notes],
      );

      // Update tenant_approval: reset hanya yang belum approve
      await client.query(
        `
        UPDATE tenant_approval
        SET approver_id = NULL,
            approved_at = NULL,
            status = 'pending',
            notes = NULL
        WHERE tenant_application_id = $1
          AND status <> 'approved' 
        `,
        [id],
      );

      // Notifikasi update dibuat setelah data dan reset approval selesai.
      // Jika transaksi rollback, notifikasi juga otomatis batal.
      await notifyTenantApplicationUpdated(
        client,
        {
          id: tenantApp.id,
          user_id,
          documentNumber: tenantApp.document_number,
          document_number: tenantApp.document_number,
          tenantName,
          tenant_name: tenantName,
          roomNumber: roomCheck.rows[0]?.room_number,
          room_number: roomCheck.rows[0]?.room_number,
          locationName,
          location_name: locationName,
          location_id,
          room_id,
          current_step: tenantApp.current_step,
        },
        user_id,
      );

      await client.query("COMMIT");

      return Response.json(
        {
          success: true,
          message:
            "Data tenant berhasil diperbarui & status ruangan diperbarui.",
          data: result.rows[0],
        },
        { status: 200 },
      );
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error update tenant:", err);
    return Response.json(
      { success: false, message: "Terjadi error: " + err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  const client = await pool.connect();
  try {
    const { id } = await context.params;
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }

    await client.query("BEGIN");

    // Ambil data tenant_application sebelum dihapus untuk update ruangan
    // dan metadata notifikasi setelah entity utamanya hilang.
    const tenantRes = await client.query(
      `
      SELECT
        ta.id,
        ta.room_id,
        ta.user_id,
        ta.document_number,
        ti.full_name AS tenant_name,
        r.room_number,
        l.location_name
      FROM tenant_application ta
      LEFT JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
      LEFT JOIN rooms r ON r.id = ta.room_id
      LEFT JOIN locations l ON l.id = ta.location_id
      WHERE ta.id = $1
      `,
      [id],
    );

    if (tenantRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Penyewa tidak ditemukan",
        }),
        { status: 200 },
      );
    }

    const deletedTenant = tenantRes.rows[0];
    const { room_id } = deletedTenant;

    // Update room agar kembali available sebelum menghapus tenant_application
    await client.query(
      `
      UPDATE rooms 
      SET status = 'available', 
          notes = NULL 
      WHERE id = $1
      `,
      [room_id],
    );

    // Hapus tenant_approval terkait
    await client.query(
      `DELETE FROM tenant_approval WHERE tenant_application_id = $1`,
      [id],
    );

    // Hapus tenant_application
    const result = await client.query(
      `DELETE FROM tenant_application WHERE id = $1 RETURNING *`,
      [id],
    );

    await notifyTenantApplicationDeleted(
      client,
      {
        id: deletedTenant.id,
        user_id: deletedTenant.user_id,
        documentNumber: deletedTenant.document_number,
        document_number: deletedTenant.document_number,
        tenantName: deletedTenant.tenant_name,
        tenant_name: deletedTenant.tenant_name,
        roomNumber: deletedTenant.room_number,
        room_number: deletedTenant.room_number,
        location_name: deletedTenant.location_name,
      },
      authUser.id,
    );

    await client.query("COMMIT");

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal menghapus Data Penyewa",
        }),
        { status: 400 },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menghapus Data Penyewa dan Ruangan tersedia kembali",
      }),
      { status: 200 },
    );
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error delete Data Penyewa:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
