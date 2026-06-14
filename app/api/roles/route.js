import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const SUPERADMIN_ROLE_ID = 1;
const MAX_ROLE_NAME_LENGTH = 50;

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status });

const normalizeRoleName = (value) => String(value || "").trim().replace(/\s+/g, " ");

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

// CREATE Role
export async function POST(req) {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const body = await req.json();
    const { roleName, error } = validateRoleName(body?.roleName);

    if (error) {
      return jsonResponse({ success: false, message: error }, 400);
    }

    const duplicateRole = await pool.query(
      `SELECT 1 FROM roles WHERE LOWER(TRIM(role_name)) = LOWER($1)`,
      [roleName],
    );

    if (duplicateRole.rows.length > 0) {
      return jsonResponse(
        { success: false, message: "Nama peran sudah terdaftar." },
        409,
      );
    }

    const result = await pool.query(
      `INSERT INTO roles (role_name)
       VALUES ($1)
       RETURNING id, role_name, updated_at, created_at`,
      [roleName],
    );

    return jsonResponse(
      {
        success: true,
        message: "Peran berhasil ditambahkan.",
        data: result.rows[0],
      },
      201,
    );
  } catch (err) {
    console.error("Error POST /api/roles:", err);
    return jsonResponse(
      { success: false, message: "Terjadi kesalahan pada server." },
      500,
    );
  }
}

export async function GET() {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const result = await pool.query(
      `SELECT id, role_name, updated_at, created_at
       FROM roles
       ORDER BY created_at DESC`,
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data peran.",
      data: result.rows,
    });
  } catch (err) {
    console.error("Error GET /api/roles:", err);
    return jsonResponse(
      { success: false, message: "Terjadi kesalahan pada server." },
      500,
    );
  }
}
