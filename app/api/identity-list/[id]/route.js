import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";

const MASTER_DATA_ROLES = [1, 2];
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function GET(request, { params }) {
  const { response } = await requireAuthenticatedUser();
  if (response) return response;

  const { id } = await params;

  if (!id || id === "undefined" || id === "null") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Parameter id tidak valid atau tidak dikirim",
        data: [],
      }),
      { status: 200 }
    );
  }

  try {
    const result = await pool.query(
      "SELECT * FROM tenant_identities WHERE id = $1 LIMIT 1",
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Data tidak ditemukan",
          data: null,
        },
        { status: 404 }
      );
    }

    const rows = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      nik: row.nik,
      full_name: row.full_name,
      ktp_file_path: row.ktp_file_path,
      birth_place: row.birth_place,
      birth_date: row.birth_date,
      nationality: row.nationality,
      religion: row.religion,
      occupation: row.occupation,
      status: row.status,
      notes: row.notes,

      // alamat detail
      street_address: row.street_address,
      rt: row.rt,
      rw: row.rw,
      kelurahan: row.kelurahan,
      district: row.district,
      city: row.city,
      province: row.province,
      postal_code: row.postal_code,

      phone: row.phone,

      updated_at: row.updated_at
        ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
      created_at: row.created_at
        ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant identities",
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

export async function DELETE(req, { params }) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id } = await params;
    const today = moment().format("YYYY-MM-DD");

    // === 1. Cek apakah data identitas ada ===
    const findRes = await client.query(
      "SELECT ktp_file_path FROM tenant_identities WHERE id = $1",
      [id]
    );

    if (findRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Data identitas tidak ditemukan" },
        { status: 200 }
      );
    }

    const ktpFilePath = findRes.rows[0].ktp_file_path;

    // === 2. Cek apakah identitas ini masih terdaftar di tenant_application ===
    const appRes = await client.query(
      `
      SELECT 
        ta.id,
        ta.approval_status,
        ta.start_date,
        ta.end_date,
        ta.location_id,
        ta.room_id,
        l.location_name,
        r.room_number
      FROM tenant_application ta
      LEFT JOIN locations l ON ta.location_id = l.id
      LEFT JOIN rooms r ON ta.room_id = r.id
      WHERE ta.tenant_identity_id = $1
      ORDER BY ta.created_at DESC
      LIMIT 1
      `,
      [id]
    );

    if (appRes.rowCount > 0) {
      const app = appRes.rows[0];

      // Jika masih dalam proses approval
      if (app.approval_status === "proses") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Identitas sedang dalam proses approval permohonan sewa ruangan.",
          },
          { status: 200 }
        );
      }

      // Jika sudah disetujui (approved)
      if (app.approval_status === "approved") {
        const endDate = app.end_date
          ? moment(app.end_date).format("YYYY-MM-DD")
          : null;

        if (endDate && moment(endDate).isSameOrAfter(today)) {
          // Masih dalam masa sewa aktif
          return NextResponse.json(
            {
              success: false,
              message: `Identitas masih terdaftar aktif di lokasi "${app.location_name}" pada ruangan "${app.room_number}". Penghapusan tidak dapat dilakukan hingga masa sewa berakhir "(${endDate})".`,
            },
            { status: 200 }
          );
        } else {
          // Masa sewa sudah lewat, boleh dihapus
          await client.query("DELETE FROM tenant_application WHERE id = $1", [
            app.id,
          ]);
        }
      }
    }

    // === 3. Jika aman, hapus identitas ===
    await client.query("DELETE FROM tenant_identities WHERE id = $1", [id]);

    // === 4. Hapus file KTP ===
    if (ktpFilePath) {
      try {
        const filePath = path.normalize(path.join(
          process.cwd(),
          ktpFilePath.replace(/^\/+/, "")
        ));
        if (filePath.startsWith(UPLOAD_ROOT) && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.warn("Gagal hapus file KTP:", fileErr.message);
      }
    }

    return NextResponse.json(
      { success: true, message: "Data identitas berhasil dihapus" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error delete identity:", err);
    return NextResponse.json(
      {
        success: false,
        message:
          err.message || "Terjadi kesalahan saat menghapus data identitas",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
