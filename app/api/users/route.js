import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const SUPERADMIN_ROLE_ID = 1;
const MAX_FULL_NAME_LENGTH = 100;
const MAX_USERNAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 6;

const jsonResponse = (payload, status = 200) =>
  Response.json(payload, { status });

const normalizeFullName = (value) =>
  String(value || "").trim().replace(/\s+/g, " ");

const normalizeUsername = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateUserPayload = ({ fullName, username, email, roleId, password }, mode) => {
  const errors = [];
  const normalizedFullName = normalizeFullName(fullName);
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  const normalizedRoleId = Number(roleId);
  const normalizedPassword = typeof password === "string" ? password : "";

  if (!normalizedFullName) errors.push("Nama lengkap wajib diisi.");
  if (normalizedFullName.length > MAX_FULL_NAME_LENGTH) {
    errors.push(`Nama lengkap maksimal ${MAX_FULL_NAME_LENGTH} karakter.`);
  }

  if (!normalizedUsername) errors.push("Username wajib diisi.");
  if (!/^[A-Za-z0-9._-]+$/.test(normalizedUsername)) {
    errors.push("Username hanya boleh berisi huruf, angka, titik, strip, dan underscore.");
  }
  if (normalizedUsername.length > MAX_USERNAME_LENGTH) {
    errors.push(`Username maksimal ${MAX_USERNAME_LENGTH} karakter.`);
  }

  if (!normalizedEmail) errors.push("Email wajib diisi.");
  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    errors.push("Format email tidak valid.");
  }
  if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
    errors.push(`Email maksimal ${MAX_EMAIL_LENGTH} karakter.`);
  }

  if (!Number.isInteger(normalizedRoleId) || normalizedRoleId <= 0) {
    errors.push("Peran pengguna tidak valid.");
  }

  if (mode === "create" && !normalizedPassword) {
    errors.push("Password wajib diisi.");
  }
  if (normalizedPassword && normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }
  if (normalizedPassword.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password maksimal ${MAX_PASSWORD_LENGTH} karakter.`);
  }

  return {
    errors,
    values: {
      fullName: normalizedFullName,
      username: normalizedUsername,
      email: normalizedEmail,
      roleId: normalizedRoleId,
      password: normalizedPassword,
    },
  };
};

const getSafeUserFields = `
  u.id,
  u.full_name,
  u.username,
  u.email,
  u.role_id,
  r.role_name,
  u.created_at,
  u.updated_at
`;

async function ensureRoleExists(roleId) {
  const result = await pool.query("SELECT id FROM roles WHERE id = $1 LIMIT 1", [
    roleId,
  ]);
  return result.rowCount > 0;
}

async function ensureUniqueUserIdentity({ username, email }) {
  const result = await pool.query(
    `
    SELECT
      EXISTS (
        SELECT 1 FROM users WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))
      ) AS username_exists,
      EXISTS (
        SELECT 1 FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($2))
      ) AS email_exists
    `,
    [username, email],
  );

  return result.rows[0] || {};
}

export async function GET() {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const result = await pool.query(
      `
      SELECT ${getSafeUserFields}
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC, u.id DESC
      `,
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data pengguna",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error GET /api/users:", error);
    return jsonResponse(
      { success: false, message: "Terjadi kesalahan saat mengambil data pengguna." },
      500,
    );
  }
}

export async function POST(req) {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const body = await req.json();
    const { errors, values } = validateUserPayload(body, "create");

    if (errors.length) {
      return jsonResponse({ success: false, message: errors[0] }, 400);
    }

    const roleExists = await ensureRoleExists(values.roleId);
    if (!roleExists) {
      return jsonResponse({ success: false, message: "Peran pengguna tidak ditemukan." }, 400);
    }

    const duplicate = await ensureUniqueUserIdentity(values);
    if (duplicate.username_exists) {
      return jsonResponse({ success: false, message: "Username sudah terdaftar." }, 409);
    }
    if (duplicate.email_exists) {
      return jsonResponse({ success: false, message: "Email sudah terdaftar." }, 409);
    }

    const result = await pool.query(
      `
      INSERT INTO users (username, password, email, full_name, role_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, username, email, role_id, created_at, updated_at
      `,
      [
        values.username,
        values.password,
        values.email,
        values.fullName,
        values.roleId,
      ],
    );

    return jsonResponse(
      {
        success: true,
        message: "Berhasil menambah pengguna baru.",
        data: result.rows[0],
      },
      201,
    );
  } catch (error) {
    console.error("Error POST /api/users:", error);

    if (error.code === "23505") {
      return jsonResponse(
        { success: false, message: "Username atau email sudah terdaftar." },
        409,
      );
    }

    return jsonResponse(
      { success: false, message: "Terjadi kesalahan saat menambah pengguna." },
      500,
    );
  }
}
