import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const SUPERADMIN_ROLE_ID = 1;
const CORE_ROLE_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8]);
const MAX_ROLE_NAME_LENGTH = 50;

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status });

const normalizeRoleName = (value) => String(value || "").trim().replace(/\s+/g, " ");

const parseRoleId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validateRoleName = (value) => {
  const roleName = normalizeRoleName(value);

  if (!roleName) {
    return { error: "Nama peran wajib diisi." };
  }

  if (roleName.length > MAX_ROLE_NAME_LENGTH) {
    return { error: `Nama peran maksimal ${MAX_ROLE_NAME_LENGTH} karakter.` };
  }

  return { roleName };
};

// UPDATE Role
export async function PUT(request, { params }) {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const { id: rawId } = await params;
    const id = parseRoleId(rawId);

    if (!id) {
      return jsonResponse({ success: false, message: "ID peran tidak valid." }, 400);
    }

    const body = await request.json();
    const { roleName, error } = validateRoleName(body?.roleName);

    if (error) {
      return jsonResponse({ success: false, message: error }, 400);
    }

    const checkRoleName = await pool.query(
      `SELECT 1
       FROM roles
       WHERE LOWER(TRIM(role_name)) = LOWER($1)
         AND id != $2`,
      [roleName, id],
    );

    if (checkRoleName.rows.length > 0) {
      return jsonResponse(
        { success: false, message: "Nama peran sudah terdaftar." },
        409,
      );
    }

    const result = await pool.query(
      `UPDATE roles
       SET role_name = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, role_name, updated_at, created_at`,
      [roleName, id],
    );

    if (result.rows.length === 0) {
      return jsonResponse({ success: false, message: "Peran tidak ditemukan." }, 404);
    }

    return jsonResponse({
      success: true,
      message: "Peran berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error PUT /api/roles/[id]:", err);
    return jsonResponse(
      { success: false, message: "Terjadi kesalahan pada server." },
      500,
    );
  }
}

// DELETE Role
export async function DELETE(_request, context) {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const { id: rawId } = await context.params;
    const id = parseRoleId(rawId);

    if (!id) {
      return jsonResponse({ success: false, message: "ID peran tidak valid." }, 400);
    }

    if (CORE_ROLE_IDS.has(id)) {
      return jsonResponse(
        {
          success: false,
          message: "Peran inti sistem tidak dapat dihapus.",
        },
        409,
      );
    }

    const usedRole = await pool.query(
      `SELECT 1
       FROM users
       WHERE role_id = $1
       LIMIT 1`,
      [id],
    );

    if (usedRole.rows.length > 0) {
      return jsonResponse(
        {
          success: false,
          message: "Peran masih digunakan oleh pengguna dan tidak dapat dihapus.",
        },
        409,
      );
    }

    const result = await pool.query(
      `DELETE FROM roles
       WHERE id = $1
       RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return jsonResponse({ success: false, message: "Peran tidak ditemukan." }, 404);
    }

    return jsonResponse({ success: true, message: "Peran berhasil dihapus." });
  } catch (err) {
    console.error("Error DELETE /api/roles/[id]:", err);
    return jsonResponse(
      { success: false, message: "Terjadi kesalahan pada server." },
      500,
    );
  }
}
