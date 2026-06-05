import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

export const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export const getYearOptions = () => {
  const currentYear = dayjs().year();
  return Array.from({ length: 6 }, (_, index) => currentYear - index);
};

/**
 * Format tanggal pendek untuk item antrean kerja.
 * Mengembalikan tanda "-" agar UI tetap stabil saat data tanggal kosong.
 */
export const formatDate = (value, format = "D MMM YYYY") =>
  value ? dayjs(value).format(format) : "-";

/**
 * Membuat teks umur relatif untuk aktivitas terbaru.
 * Dipisahkan agar komponen list tidak menyimpan logika tanggal.
 */
export const fromNow = (value) => {
  if (!value) return "-";
  const diffMinutes = dayjs().diff(dayjs(value), "minute");
  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = dayjs().diff(dayjs(value), "hour");
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${dayjs().diff(dayjs(value), "day")} hari lalu`;
};

export const getDaysLabel = (days) => {
  const total = Number(days);
  if (Number.isNaN(total)) return "-";
  if (total < 0) return `${Math.abs(total)} hari terlambat`;
  if (total === 0) return "Hari ini";
  return `${total} hari lagi`;
};

export const getContractDaysLabel = (days) => {
  const total = Number(days);
  if (Number.isNaN(total)) return "-";
  if (total < 0) return `${Math.abs(total)} hari berakhir`;
  if (total === 0) return "Berakhir hari ini";
  return `${total} hari lagi`;
};
