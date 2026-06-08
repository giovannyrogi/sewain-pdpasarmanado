import dayjs from "dayjs";

/**
 * Menormalisasi durasi sewa agar kalkulasi kontrak selalu memakai angka tahun
 * yang valid. Default 1 tahun dipakai untuk menjaga kompatibilitas data lama.
 */
export const normalizeLeaseDurationYears = (duration) => {
  const value = Number(duration);
  return Number.isInteger(value) && value > 0 ? value : 1;
};

/**
 * Menghitung tanggal akhir kontrak dari tanggal mulai dan durasi tahun.
 * Kontrak 1 tahun dari 1 Januari 2026 akan berakhir 31 Desember 2026.
 */
export const calculateLeaseEndDate = (startDate, durationYears = 1) => {
  if (!startDate) return null;

  const start = dayjs(startDate);
  if (!start.isValid()) return null;

  return start
    .add(normalizeLeaseDurationYears(durationYears), "year")
    .subtract(1, "day");
};

/**
 * Menghitung nilai sewa dasar ruangan untuk 1 tahun tanpa PPN, admin fee,
 * atau cicilan. Nilai ini dipakai sebagai snapshot annual_room_rent.
 */
export const calculateAnnualRoomRent = (room = {}) => {
  const length = Number(room?.room_length || 0);
  const width = Number(room?.room_width || 0);
  const price = Number(room?.price_per_m2 || 0);

  if (room?.price_type === "harga_tetap") {
    return price;
  }

  return length * width * price;
};

/**
 * Alias lama tetap dipertahankan agar halaman lain yang belum membutuhkan
 * durasi kontrak tetap mendapatkan nilai sewa dasar 1 tahun.
 */
export const calculateRoomRent = calculateAnnualRoomRent;

/**
 * Menghitung total sewa kontrak sesuai durasi tahun.
 * Rumus bisnis: harga sewa 1 tahun x lama sewa dalam tahun.
 */
export const calculateContractRoomRent = (room = {}, durationYears = 1) =>
  calculateAnnualRoomRent(room) * normalizeLeaseDurationYears(durationYears);
