import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  console.log("id", id);

  try {
    const result = await pool.query(
      `SELECT * FROM tenant_identities WHERE id = $1`,
      [id]
    );

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

// DELETE Identity
export async function DELETE(req, { params }) {
  const client = await pool.connect();

  try {
    const { id } = params;

    // Ambil data dulu (untuk cek apakah ada dan dapat path file KTP)
    const findRes = await client.query(
      "SELECT ktp_file_path FROM tenant_identities WHERE id = $1",
      [id]
    );

    if (findRes.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Data identitas tidak ditemukan" },
        { status: 404 }
      );
    }

    const ktpFilePath = findRes.rows[0].ktp_file_path;

    // Hapus dari DB
    await client.query("DELETE FROM tenant_identities WHERE id = $1", [id]);

    // Hapus file KTP kalau ada
    if (ktpFilePath) {
      try {
        const filePath = path.join(process.cwd(), "public", ktpFilePath);
        if (fs.existsSync(filePath)) {
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
    console.error("Error delete identity:", err.message);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
