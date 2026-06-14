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

const parseUserId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validateUserPayload = ({ fullName, username, email, roleId, password }) => {
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

async function ensureRoleExists(roleId) {
  const result = await pool.query("SELECT id FROM roles WHERE id = $1 LIMIT 1", [
    roleId,
  ]);
  return result.rowCount > 0;
}

async function ensureUniqueUserIdentity({ id, username, email }) {
  const result = await pool.query(
    `
    SELECT
      EXISTS (
        SELECT 1
        FROM users
        WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))
          AND id <> $3
      ) AS username_exists,
      EXISTS (
        SELECT 1
        FROM users
        WHERE LOWER(TRIM(email)) = LOWER(TRIM($2))
          AND id <> $3
      ) AS email_exists
    `,
    [username, email, id],
  );

  return result.rows[0] || {};
}

export async function PUT(request, { params }) {
  try {
    const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const { id: rawId } = await params;
    const id = parseUserId(rawId);

    if (!id) {
      return jsonResponse({ success: false, message: "ID pengguna tidak valid." }, 400);
    }

    const body = await request.json();
    const { errors, values } = validateUserPayload(body);

    if (errors.length) {
      return jsonResponse({ success: false, message: errors[0] }, 400);
    }

    const roleExists = await ensureRoleExists(values.roleId);
    if (!roleExists) {
      return jsonResponse({ success: false, message: "Peran pengguna tidak ditemukan." }, 400);
    }

    const duplicate = await ensureUniqueUserIdentity({ id, ...values });
    if (duplicate.username_exists) {
      return jsonResponse({ success: false, message: "Username sudah terdaftar." }, 409);
    }
    if (duplicate.email_exists) {
      return jsonResponse({ success: false, message: "Email sudah terdaftar." }, 409);
    }

    const hasPasswordUpdate = Boolean(values.password);
    const result = hasPasswordUpdate
      ? await pool.query(
          `
          UPDATE users
          SET username = $1,
              password = $2,
              email = $3,
              full_name = $4,
              role_id = $5,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING id, full_name, username, email, role_id, created_at, updated_at
          `,
          [
            values.username,
            values.password,
            values.email,
            values.fullName,
            values.roleId,
            id,
          ],
        )
      : await pool.query(
          `
          UPDATE users
          SET username = $1,
              email = $2,
              full_name = $3,
              role_id = $4,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING id, full_name, username, email, role_id, created_at, updated_at
          `,
          [values.username, values.email, values.fullName, values.roleId, id],
        );

    if (result.rowCount === 0) {
      return jsonResponse({ success: false, message: "Pengguna tidak ditemukan." }, 404);
    }

    return jsonResponse({
      success: true,
      message: "Berhasil mengubah data pengguna.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error PUT /api/users/[id]:", error);

    if (error.code === "23505") {
      return jsonResponse(
        { success: false, message: "Username atau email sudah terdaftar." },
        409,
      );
    }

    return jsonResponse(
      { success: false, message: "Terjadi kesalahan saat mengubah pengguna." },
      500,
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { user, response } = await requireRole([SUPERADMIN_ROLE_ID]);
    if (response) return response;

    const { id: rawId } = await params;
    const id = parseUserId(rawId);

    if (!id) {
      return jsonResponse({ success: false, message: "ID pengguna tidak valid." }, 400);
    }

    if (Number(user.id) === id) {
      return jsonResponse(
        {
          success: false,
          message: "Akun yang sedang login tidak dapat dihapus.",
        },
        409,
      );
    }

    const targetUser = await pool.query(
      "SELECT id, role_id FROM users WHERE id = $1 LIMIT 1",
      [id],
    );

    if (targetUser.rowCount === 0) {
      return jsonResponse({ success: false, message: "Pengguna tidak ditemukan." }, 404);
    }

    if (Number(targetUser.rows[0].role_id) === SUPERADMIN_ROLE_ID) {
      const superadminCount = await pool.query(
        "SELECT COUNT(*)::int AS total FROM users WHERE role_id = $1",
        [SUPERADMIN_ROLE_ID],
      );

      if (Number(superadminCount.rows[0]?.total || 0) <= 1) {
        return jsonResponse(
          {
            success: false,
            message: "Superadmin terakhir tidak dapat dihapus.",
          },
          409,
        );
      }
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    return jsonResponse({ success: true, message: "Berhasil menghapus pengguna." });
  } catch (error) {
    console.error("Error DELETE /api/users/[id]:", error);

    if (error.code === "23503") {
      return jsonResponse(
        {
          success: false,
          message: "Pengguna masih dipakai pada data lain sehingga tidak dapat dihapus.",
        },
        409,
      );
    }

    return jsonResponse(
      { success: false, message: "Terjadi kesalahan saat menghapus pengguna." },
      500,
    );
  }
}
