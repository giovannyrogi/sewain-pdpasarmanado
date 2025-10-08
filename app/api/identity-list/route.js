import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";

const uploadDir = path.join(process.cwd(), "public/uploads/ktp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    // Ambil fields dari formData
    const nik = formData.get("nomorIndukKependudukan");
    const full_name = formData.get("namaLengkap");
    const birth_place = formData.get("tempatLahir");
    const birth_date = formData.get("tanggalLahir");
    const religion = formData.get("agama");
    const occupation = formData.get("pekerjaan");
    const nationality = formData.get("wargaNegara");
    const phone = formData.get("phone");
    const status = formData.get("status");
    const notes = formData.get("notes");

    const street_address = formData.get("alamatJalan");
    const rt = formData.get("rt");
    const rw = formData.get("rw");
    const province = formData.get("provinsi");
    const city = formData.get("kabupaten");
    const district = formData.get("kecamatan");
    const kelurahan = formData.get("kelurahan");

    const ktpFile = formData.get("ktpFile");

    if (
      !nik ||
      !full_name ||
      !birth_place ||
      !birth_date ||
      !religion ||
      !occupation ||
      !nationality ||
      !phone ||
      !status
    ) {
      return Response.json(
        { success: false, message: "Data wajib tidak lengkap." },
        { status: 400 }
      );
    }

    //cek duplikasi NIK
    const checkNIK = await pool.query(
      "SELECT 1 FROM tenant_identities WHERE nik = $1",
      [nik]
    );
    if (checkNIK.rows.length > 0) {
      return Response.json(
        { success: false, message: "NIK sudah terdaftar!" },
        { status: 400 }
      );
    }

    let ktp_file_path = null;
    let fileBuffer = null;
    let filename = null;

    if (ktpFile && ktpFile.name) {
      const arrayBuffer = await ktpFile.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      const ext = path.extname(ktpFile.name).toLowerCase() || ".jpg";
      if (![".jpg", ".jpeg", ".png", ".pdf"].includes(ext)) {
        return Response.json(
          { success: false, message: "Format file KTP tidak valid." },
          { status: 400 }
        );
      }

      filename = `ktp_${full_name}_${moment().format(
        "YYYY_MM_DD_HH_mm_ss"
      )}${ext}`;
      ktp_file_path = `/uploads/ktp/${filename}`;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        INSERT INTO tenant_identities (
          nik, full_name, ktp_file_path, birth_place, birth_date, nationality,
          religion, occupation, street_address, rt, rw, kelurahan, district,
          city, province, phone, status, notes
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18
        )
        RETURNING *
        `,
        [
          nik,
          full_name,
          ktp_file_path,
          birth_place,
          moment(birth_date).format("YYYY-MM-DD"),
          nationality,
          religion,
          occupation,
          street_address,
          rt,
          rw,
          kelurahan,
          district,
          city,
          province,
          phone,
          status,
          notes,
        ]
      );

      await client.query("COMMIT");

      // Simpan file setelah commit sukses
      if (fileBuffer && filename) {
        const filepath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filepath, fileBuffer);
      }

      return Response.json(
        {
          success: true,
          message: "Data berhasil disimpan.",
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
      `
      SELECT 
        id,
        user_id,
        nik,
        full_name,
        ktp_file_path,
        birth_place,
        birth_date,
        nationality,
        religion,
        occupation,
        street_address,
        rt,
        rw,
        kelurahan,
        district,
        city,
        province,
        postal_code,
        phone,
        status,
        notes,
        created_at,
        updated_at
      FROM tenant_identities 
      ORDER BY created_at DESC
      `
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
      status: row.status,
      phone: row.phone,
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
