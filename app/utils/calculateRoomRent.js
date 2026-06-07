/**
 * Menghitung nilai sewa dasar ruangan tanpa PPN, biaya admin, atau cicilan.
 * Fungsi ini dipisah dari kalkulasi pembayaran agar rumus harga ruangan
 * konsisten dipakai di master Rooms maupun flow tenant application.
 */
export const calculateRoomRent = (room = {}) => {
  const length = Number(room?.room_length || 0);
  const width = Number(room?.room_width || 0);
  const price = Number(room?.price_per_m2 || 0);

  if (room?.price_type === "harga_tetap") {
    return price;
  }

  return length * width * price;
};
