import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const ACCESS_ROLES = [1, 9];
const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "surat_pernyataan_izin_lahan",
);

export async function DELETE(_request, context) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const { id } = await context.params;
    const terminationId = Number(id);

    if (!Number.isInteger(terminationId) || terminationId <= 0) {
      return Response.json(
        { success: false, message: "ID non-aktif izin lahan tidak valid." },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const terminationResult = await client.query(
      `
      SELECT id, statement_file_path, approval_status
      FROM land_permit_terminations
      WHERE id = $1
      FOR UPDATE
      `,
      [terminationId],
    );

    if (terminationResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Data non-aktif izin lahan tidak ditemukan." },
        { status: 404 },
      );
    }

    const termination = terminationResult.rows[0];
    if (termination.approval_status !== "rejected") {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message:
            "Hanya pengajuan non-aktif izin lahan yang ditolak yang dapat dibatalkan.",
        },
        { status: 400 },
      );
    }

    await client.query(
      "DELETE FROM land_permit_termination_approval WHERE land_permit_termination_id = $1",
      [terminationId],
    );
    await client.query("DELETE FROM land_permit_terminations WHERE id = $1", [
      terminationId,
    ]);

    await client.query("COMMIT");

    if (termination.statement_file_path) {
      const filePath = path.normalize(
        path.join(uploadDir, path.basename(termination.statement_file_path)),
      );
      if (filePath.startsWith(uploadDir) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return Response.json({
      success: true,
      message: "Pengajuan non-aktif izin lahan berhasil dibatalkan.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("Error deleting land permit termination:", error);
    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat membatalkan pengajuan non-aktif izin lahan.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
