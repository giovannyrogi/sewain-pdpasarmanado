import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";

const uploadDir = path.join(process.cwd(), "uploads/ktp");
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
    const notes = formData.get("notes");
    const status = formData.get("status");

    // validasi field wajib
    if (!nik) {
      return Response.json(
        { success: false, message: "NIK wajib diisi!" },
        { status: 400 }
      );
    }

    if (!full_name) {
      return Response.json(
        { success: false, message: "Nama Lengkap wajib diisi!" },
        { status: 400 }
      );
    }

    if (!id) {
      return Response.json(
        { success: false, message: "ID data tidak ditemukan." },
        { status: 400 }
      );
    }

    if (!status) {
      return Response.json(
        { success: false, message: "Status wajib diisi!" },
        { status: 400 }
      );
    }

    if (!phone) {
      return Response.json(
        { success: false, message: "Nomor Telepon wajib diisi!" },
        { status: 400 }
      );
    }

    if (!street_address) {
      return Response.json(
        { success: false, message: "Alamat wajib diisi!" },
        { status: 400 }
      );
    }

    if (!province) {
      return Response.json(
        { success: false, message: "Provinsi wajib diisi!" },
        { status: 400 }
      );
    }

    if (!city) {
      return Response.json(
        { success: false, message: "Kota wajib diisi!" },
        { status: 400 }
      );
    }

    if (!district) {
      return Response.json(
        { success: false, message: "Kecamatan wajib diisi!" },
        { status: 400 }
      );
    }

    if (!kelurahan) {
      return Response.json(
        { success: false, message: "Kelurahan wajib diisi!" },
        { status: 400 }
      );
    }

    if (!birth_date) {
      return Response.json(
        { success: false, message: "Tanggal Lahir wajib diisi!" },
        { status: 400 }
      );
    }

    if (!birth_place) {
      return Response.json(
        { success: false, message: "Tempat Lahir wajib diisi!" },
        { status: 400 }
      );
    }

    if (!religion) {
      return Response.json(
        { success: false, message: "Agama wajib diisi!" },
        { status: 400 }
      );
    }

    if (!occupation) {
      return Response.json(
        { success: false, message: "Pekerjaan wajib diisi!" },
        { status: 400 }
      );
    }

    if (!nationality) {
      return Response.json(
        { success: false, message: "Warga Negara wajib diisi!" },
        { status: 400 }
      );
    }

    // Validasi NIK tidak boleh sama
    const checkNIK = await pool.query(
      `SELECT id FROM tenant_identities WHERE nik = $1 AND id != $2 LIMIT 1;`,
      [nik, id]
    );
    if (checkNIK.rows.length > 0) {
      return Response.json(
        { success: false, message: "NIK sudah terdaftar!" },
        { status: 400 }
      );
    }

    // Validasi NIK harus 16 Digit
    if (nik.length !== 16) {
      return Response.json(
        { success: false, message: "Nomor NIK tidak valid, harus 16 digit!" },
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
      ktp_file_path = `/api/uploads/ktp/${filename}`;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const oldData = await client.query(
        `SELECT ktp_file_path FROM tenant_identities WHERE id = $1`,
        [id]
      );

      const dbOldKtpPath = oldData.rows[0]?.ktp_file_path || null;

      // Simpan file baru dulu
      if (fileBuffer && filename) {
        const filepath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filepath, fileBuffer);
      }

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
          notes = $17,
          status = $18
        WHERE id = $19
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
          notes,
          status,
          id,
        ]
      );

      await client.query("COMMIT");

      // lalu hapus file lama
      if (fileBuffer && filename && dbOldKtpPath) {
        try {
          const relativePath = dbOldKtpPath.replace("/api/uploads/", "");
          const oldFilePath = path.normalize(
            path.join(process.cwd(), "uploads", relativePath)
          );

          if (oldFilePath.startsWith(uploadDir) && fs.existsSync(oldFilePath)) {
            await fs.promises.unlink(oldFilePath);
          }
        } catch (err) {
          console.warn("Gagal hapus file lama:", err.message);
        }
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
