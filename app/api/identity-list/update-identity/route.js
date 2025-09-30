import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";

const uploadDir = path.join(process.cwd(), "public/uploads/ktp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function PUT(req) {
  try {
    const formData = await req.formData();

    const id = formData.get("id"); // ambil id untuk data yg mau diedit
    const nik = formData.get("nomorIndukKependudukan");
    const full_name = formData.get("namaLengkap");
    const birth_place = formData.get("tempatLahir");
    const birth_date = formData.get("tanggalLahir");
    const religion = formData.get("agama");
    const occupation = formData.get("pekerjaan");
    const nationality = formData.get("wargaNegara");
    const phone = formData.get("phone");

    const street_address = formData.get("alamatJalan");
    const rt = formData.get("rt");
    const rw = formData.get("rw");
    const province = formData.get("provinsi");
    const city = formData.get("kabupaten");
    const district = formData.get("kecamatan");
    const kelurahan = formData.get("kelurahan");

    const ktpFile = formData.get("ktpFile");
    const oldKtpPath = formData.get("oldKtpPath"); // path lama dikirim dari FE

    if (!id) {
      return Response.json(
        { success: false, message: "ID data tidak ditemukan." },
        { status: 400 }
      );
    }

    let ktp_file_path = oldKtpPath || null;
    let fileBuffer = null;
    let filename = null;

    // kalau ada file baru
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
        UPDATE tenant_identities SET
          nik = $1,
          full_name = $2,
          ktp_file_path = $3,
          birth_place = $4,
          birth_date = $5,
          nationality = $6,
          religion = $7,
          occupation = $8,
          street_address = $9,
          rt = $10,
          rw = $11,
          kelurahan = $12,
          district = $13,
          city = $14,
          province = $15,
          phone = $16,
          updated_at = NOW()
        WHERE id = $17
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
          id,
        ]
      );

      await client.query("COMMIT");

      // simpan file baru kalau ada
      if (fileBuffer && filename) {
        const filepath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filepath, fileBuffer);
      }

      return Response.json(
        {
          success: true,
          message: "Data berhasil diperbarui.",
          data: result.rows[0],
        },
        { status: 200 }
      );
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error update:", err);
    return Response.json(
      { success: false, message: "Terjadi error: " + err.message },
      { status: 500 }
    );
  }
}
