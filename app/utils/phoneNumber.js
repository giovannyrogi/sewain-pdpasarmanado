const LOCAL_PHONE_MAX_LENGTH = 13;
const LOCAL_PHONE_PATTERN = /^8[0-9]{8,12}$/;

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

/**
 * Mengubah input nomor Indonesia menjadi angka lokal tanpa prefix negara.
 * User bisa paste +628xxx, 628xxx, atau 08xxx, tetapi form tetap menampilkan
 * 8xxx karena prefix +62 sudah disediakan sebagai adornment.
 */
export const normalizeIndonesianPhoneInput = (value) => {
  let digits = onlyDigits(value);

  if (digits.startsWith("62")) {
    digits = digits.slice(2);
  }

  digits = digits.replace(/^0+/, "");

  return digits.slice(0, LOCAL_PHONE_MAX_LENGTH);
};

export const validateIndonesianPhoneLocal = (value) => {
  const localNumber = normalizeIndonesianPhoneInput(value);

  if (!localNumber) {
    return {
      value: "",
      error: "Nomor telepon wajib diisi.",
    };
  }

  if (!LOCAL_PHONE_PATTERN.test(localNumber)) {
    return {
      value: localNumber,
      error: "Nomor HP harus diawali 8 dan berisi 9 sampai 13 digit setelah +62.",
    };
  }

  return {
    value: localNumber,
    error: null,
  };
};

/**
 * Format final yang disimpan ke database dan dipakai integrasi WhatsApp.
 */
export const normalizeIndonesianPhone = (value) => {
  const result = validateIndonesianPhoneLocal(value);

  if (result.error) {
    return result;
  }

  return {
    value: `+62${result.value}`,
    error: null,
  };
};

export const getIndonesianPhoneLocalValue = (value) =>
  normalizeIndonesianPhoneInput(value);

export const getWhatsAppPhone = (value) => {
  const result = normalizeIndonesianPhone(value);

  if (result.error) {
    return null;
  }

  return result.value.replace("+", "");
};
