import {
  getIndonesianPhoneLocalValue,
  normalizeIndonesianPhone,
} from "@/app/utils/phoneNumber";

export const initialProfileForm = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
};

export const initialPasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

export const displayValue = (value) => value || "-";

export const mapUserToProfileForm = (user) => ({
  fullName: user?.full_name || "",
  username: user?.username || "",
  email: user?.email || "",
  phone: getIndonesianPhoneLocalValue(user?.phone || ""),
});

export const normalizeProfilePayload = (form) => {
  const fullName = String(form.fullName || "").trim();
  const username = String(form.username || "").trim();
  const email = String(form.email || "").trim().toLowerCase();
  const phone = normalizeIndonesianPhone(form.phone);

  if (!fullName) return { error: "Nama lengkap wajib diisi." };
  if (fullName.length > 100) return { error: "Nama lengkap maksimal 100 karakter." };
  if (!username) return { error: "Username wajib diisi." };
  if (username.length > 100) return { error: "Username maksimal 100 karakter." };
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Username hanya boleh berisi huruf, angka, titik, underscore, atau strip.",
    };
  }
  if (!email) return { error: "Email wajib diisi." };
  if (email.length > 100) return { error: "Email maksimal 100 karakter." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Format email tidak valid." };
  if (phone.error) return { error: phone.error };

  return {
    values: {
      fullName,
      username,
      email,
      phone: phone.value,
    },
  };
};

export const validatePasswordPayload = (form) => {
  const oldPassword = String(form.oldPassword || "");
  const newPassword = String(form.newPassword || "");
  const comfirmNewPassword = String(form.confirmNewPassword || "");

  if (!oldPassword) return { error: "Password lama wajib diisi." };
  if (!newPassword) return { error: "Password baru wajib diisi." };
  if (newPassword.length < 6) {
    return { error: "Password baru minimal 6 karakter." };
  }
  if (newPassword.length > 255) {
    return { error: "Password baru maksimal 255 karakter." };
  }
  if (!comfirmNewPassword) {
    return { error: "Konfirmasi password baru wajib diisi." };
  }
  if (newPassword !== comfirmNewPassword) {
    return { error: "Password baru dan konfirmasi password tidak sama." };
  }

  return {
    values: {
      oldPassword,
      newPassword,
      comfirmNewPassword,
    },
  };
};

export const formatAccountDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
