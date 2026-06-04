import pool from "@/lib/dbConfig";
import fs from "fs";
import path from "path";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  getTerminationNotificationContext,
  notifyTerminationDeleted,
} from "@/app/utils/notifications";

export async function DELETE(request, context) {
  const { id } = await context.params; // termination_id
  const client = await pool.connect();

  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ID termination wajib diisi",
        }),
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Ambil data termination (untuk dapatkan path file)
    const terminationRes = await client.query(
      `SELECT statement_file_path FROM tenant_early_terminations WHERE id = $1`,
      [id]
    );
    if (terminationRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Tenant Termination tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const { statement_file_path } = terminationRes.rows[0];
    const notificationContext = await getTerminationNotificationContext(client, id);

    if (notificationContext) {
      await notifyTerminationDeleted(client, notificationContext, authUser.id);
    }

    // Hapus data approval yang terkait dulu
    await client.query(
      `DELETE FROM tenant_termination_approval WHERE tenant_early_termination_id = $1`,
      [id]
    );

    // Hapus data dari tenant_early_terminations
    await client.query(`DELETE FROM tenant_early_terminations WHERE id = $1`, [
      id,
    ]);

    await client.query("COMMIT");

    // Hapus file surat pernyataan jika ada
    if (statement_file_path) {
      // Ambil nama file saja
      const fileName = path.basename(statement_file_path);

      console.log('fileName', fileName);
      

      // Path fisik file
      const filePath = path.join(process.cwd(), "uploads/surat_pernyataan", fileName.replace(/^\/+/, ""));

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("File surat pernyataan berhasil dihapus:", filePath);
      } else {
        console.log("File surat pernyataan tidak ditemukan:", filePath);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Proses pembatalan berhasil dilakukan",
      }),
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error DELETE Tenant Early Termination:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
