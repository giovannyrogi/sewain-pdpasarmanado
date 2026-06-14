import moment from "moment";

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const SUPERADMIN_ROLE_ID = 1;
export const APPROVAL_ROLE_IDS = new Set([3, 4, 5, 6, 7]);
export const MAX_FULL_NAME_LENGTH = 100;
export const MAX_USERNAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 100;
export const MAX_PASSWORD_LENGTH = 255;
export const MIN_PASSWORD_LENGTH = 6;

export const getInitialForm = () => ({
  fullName: "",
  username: "",
  password: "",
  email: "",
  roleId: "",
});

export const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

export const normalizeSearch = (value) => String(value || "").toLowerCase();

export const normalizeFullName = (value) =>
  String(value || "").trim().replace(/\s+/g, " ");

export const normalizeUsername = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "");

export const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

export const formatDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

export const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({ text: value, value }));

export const createExactFilter = (key) => (value, record) => record[key] === value;

export const getRoleCategory = (roleId) => {
  const normalizedRoleId = Number(roleId);

  if (normalizedRoleId === 1) return { label: "Superadmin", color: "red" };
  if (normalizedRoleId === 2) return { label: "Admin Kontrak", color: "orange" };
  if (APPROVAL_ROLE_IDS.has(normalizedRoleId)) {
    return { label: "Approval", color: "gold" };
  }
  if (normalizedRoleId === 8) return { label: "Keuangan", color: "green" };
  return { label: "Tambahan", color: "blue" };
};

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateForm = (form, mode) => {
  const errors = {};
  const fullName = normalizeFullName(form.fullName);
  const username = normalizeUsername(form.username);
  const email = normalizeEmail(form.email);
  const roleId = Number(form.roleId);
  const password = String(form.password || "");

  if (!fullName) errors.fullName = "Nama lengkap wajib diisi.";
  else if (fullName.length > MAX_FULL_NAME_LENGTH) {
    errors.fullName = `Nama lengkap maksimal ${MAX_FULL_NAME_LENGTH} karakter.`;
  }

  if (!username) errors.username = "Username wajib diisi.";
  else if (!/^[A-Za-z0-9._-]+$/.test(username)) {
    errors.username =
      "Username hanya boleh berisi huruf, angka, titik, strip, dan underscore.";
  } else if (username.length > MAX_USERNAME_LENGTH) {
    errors.username = `Username maksimal ${MAX_USERNAME_LENGTH} karakter.`;
  }

  if (!email) errors.email = "Email wajib diisi.";
  else if (!isValidEmail(email)) errors.email = "Format email tidak valid.";
  else if (email.length > MAX_EMAIL_LENGTH) {
    errors.email = `Email maksimal ${MAX_EMAIL_LENGTH} karakter.`;
  }

  if (!roleId) errors.roleId = "Peran wajib dipilih.";

  if (mode === "create" && !password) {
    errors.password = "Password wajib diisi.";
  } else if (password && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    errors.password = `Password maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  }

  return errors;
};
