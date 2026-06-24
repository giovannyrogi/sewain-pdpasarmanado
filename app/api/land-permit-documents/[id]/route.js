import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const ACCESS_ROLES = [1, 3, 4, 5, 6, 7, 9];
const WRITE_ROLES = [1, 9];

export async function PUT(_request, { params }) {
  try {
    const { user, response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const documentId = Number(rawId);
    if (!Number.isInteger(documentId) || documentId <= 0) {
      return Response.json(
        { success: false, message: "ID dokumen tidak valid." },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      UPDATE land_permit_documents
      SET printed_at = NOW(),
          printed_by = $1,
          status = 'printed',
          updated_at = NOW()
      WHERE id = $2
        AND document_type = 'permit_document'
      RETURNING id
      `,
      [user.id, documentId],
    );

    if (result.rowCount === 0) {
      return Response.json(
        { success: false, message: "Dokumen izin lahan tidak ditemukan." },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Riwayat cetak dokumen berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Error marking land permit document as printed:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui riwayat cetak dokumen.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { response } = await requireRole(WRITE_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const documentId = Number(rawId);
    if (!Number.isInteger(documentId) || documentId <= 0) {
      return Response.json(
        { success: false, message: "ID dokumen tidak valid." },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      DELETE FROM land_permit_documents
      WHERE id = $1
        AND document_type = 'permit_document'
      RETURNING id
      `,
      [documentId],
    );

    if (result.rowCount === 0) {
      return Response.json(
        { success: false, message: "Dokumen izin lahan tidak ditemukan." },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Dokumen izin lahan berhasil dihapus.",
    });
  } catch (error) {
    console.error("Error deleting land permit document:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menghapus dokumen izin lahan.",
      },
      { status: 500 },
    );
  }
}
