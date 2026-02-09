import pool from "@/lib/dbConfig";
import moment from "moment";

export async function PUT(request, { params }) {
  const client = await pool.connect();
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      location_id,
      room_number,
      floor_id,
      room_length,
      room_width,
      status,
      price_per_m2,
      notes,
      price_type
    } = body;

    // Validasi field wajib
    if (!location_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Lokasi wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!floor_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Lantai wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!room_number) {
      return new Response(
        JSON.stringify({ success: false, message: "Nomor kamar wajib diisi!" }),
        { status: 400 }
      );
    }

    // if (!room_length || !room_width) {
    //   return new Response(
    //     JSON.stringify({
    //       success: false,
    //       message: "Panjang dan lebar kamar wajib diisi!",
    //     }),
    //     { status: 400 }
    //   );
    // }

    if (!status) {
      return new Response(
        JSON.stringify({ success: false, message: "Status wajib diisi!" }),
        { status: 400 }
      );
    }

    if (price_per_m2 < 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Harga wajib diisi!" }),
        { status: 400 }
      );
    }

    if (notes) {
      if (notes.length > 150) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Notes maksimal 150 karakter!",
          }),
          { status: 400 }
        );
      }
    }

    // Validasi input status
    if (
      !["available", "occupied", "unavailable", "maintenance"].includes(status)
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Status tidak valid" }),
        { status: 400 }
      );
    }

    // Validasi cek apakah ruangan yang sama ada di lokasi ini
    const checkRoom = await client.query(
      `SELECT * FROM rooms WHERE location_id = $1 AND room_number = $2 AND id != $3`,
      [location_id, room_number, id]
    );

    if (checkRoom.rowCount > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Nomor ruangan sudah terdaftar pada lokasi yang dipilih!",
        }),
        { status: 400 }
      );
    }

    // 1. Cek data ruangan
    const roomRes = await client.query(`SELECT * FROM rooms WHERE id=$1`, [id]);
    if (roomRes.rowCount === 0) {
      return Response.json(
        { success: false, message: "Ruangan tidak ditemukan" },
        { status: 404 }
      );
    }

    const roomData = roomRes.rows[0];
    const wantsToChangeStatus =
      typeof status !== "undefined" && status !== roomData.status;

    // 2. Kalau user mau ubah status ruangan
    if (wantsToChangeStatus) {
      // Cek apakah ruangan ini pernah / sedang disewa
      const tenantRes = await client.query(
        `
        SELECT ta.id, ti.full_name AS tenant_name, ta.start_date, ta.end_date
        FROM tenant_application ta
        JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
        WHERE ta.room_id = $1
        `,
        [id]
      );

      if (tenantRes.rowCount > 0) {
        const today = moment().format("YYYY-MM-DD");

        for (const t of tenantRes.rows) {
          const start = t.start_date
            ? moment(t.start_date).format("YYYY-MM-DD")
            : null;
          const end = t.end_date
            ? moment(t.end_date).format("YYYY-MM-DD")
            : null;

          // Tidak boleh ubah kalau tanggal kontrak belum lengkap
          if (!start || !end) {
            return Response.json(
              {
                success: false,
                message: `Ruangan ini masih terdaftar pada permohonan penyewa "${t.tenant_name}". Status tidak dapat diubah.`,
              },
              { status: 400 }
            );
          }

          // Cek apakah ada terminasi
          const terminateRes = await client.query(
            `
            SELECT is_terminated, approval_status
            FROM tenant_early_terminations
            WHERE tenant_application_id = $1
            ORDER BY id DESC
            LIMIT 1
            `,
            [t.id]
          );

          const hasTermination = terminateRes.rowCount > 0;
          const termination = hasTermination ? terminateRes.rows[0] : null;
          const isTerminatedApproved =
            hasTermination &&
            termination.is_terminated === true &&
            termination.approval_status === "approved";

          // Kalau kontrak masih aktif DAN belum terminasi disetujui
          if (end >= today && !isTerminatedApproved) {
            return Response.json(
              {
                success: false,
                message: `Ruangan sedang digunakan oleh "${t.tenant_name}" sampai ${end}. Status tidak dapat diubah.`,
              },
              { status: 400 }
            );
          }

          // Kalau belum ada terminasi data sama sekali
          if (end >= today && !hasTermination) {
            return Response.json(
              {
                success: false,
                message: `Penyewa "${t.tenant_name}" belum memiliki data terminasi kontrak. Status tidak dapat diubah.`,
              },
              { status: 400 }
            );
          }

          // Kalau ada terminasi tapi belum disetujui
          if (hasTermination && !isTerminatedApproved) {
            return Response.json(
              {
                success: false,
                message: `Kontrak penyewa "${t.tenant_name}" belum disetujui terminasi. Status ruangan tidak dapat diubah.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // 3. Update data room
    const updateRes = await client.query(
      `
      UPDATE rooms 
         SET location_id = $1,
             room_number  = $2,
             floor_id     = $3,
             room_length  = $4,
             room_width   = $5,
             status       = $6,
             price_per_m2 = $7,
             notes        = $8,
             price_type   = $9
       WHERE id = $10
       RETURNING *
      `,
      [
        location_id,
        room_number,
        floor_id,
        room_length,
        room_width,
        typeof status === "undefined" ? roomData.status : status,
        price_per_m2,
        notes,
        price_type,
        id,
      ]
    );

    return Response.json(
      {
        success: true,
        message: "Berhasil mengubah data Ruangan",
        data: updateRes.rows[0],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error update Ruangan:", err);
    return Response.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE Rooms
export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    // Cek apakah ada tenant yang menggunakan room ini (join tenant_identities)
    const checkTenant = await pool.query(
      `
      SELECT ti.full_name AS tenant_name
      FROM tenant_application ta
      JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      WHERE ta.room_id = $1
      `,
      [id]
    );

    if (checkTenant.rows.length > 0) {
      const tenantList = checkTenant.rows.map((t) => t.tenant_name).join(", ");

      return new Response(
        JSON.stringify({
          success: false,
          message: `Ruangan ini tidak bisa dihapus, karena masih dipakai oleh penyewa: ${tenantList}`,
        }),
        { status: 200 }
      );
    }

    // Jika aman, hapus ruangan
    const result = await pool.query(
      `DELETE FROM rooms WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Ruangan tidak ditemukan atau gagal dihapus",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menghapus ruangan",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error delete ruangan", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
