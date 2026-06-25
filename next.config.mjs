/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aktifkan pemeriksaan React agar bug mudah ditemukan
  reactStrictMode: true,

  // Hapus header X-Powered-By (mencegah fingerprint)
  poweredByHeader: false,

  // Hardening keamanan bawaan Next.js
  compress: true, // gzip compress
  cleanDistDir: true, // hapus folder .next lama saat build

  // Standar untuk runtime modern
  output: "standalone", // terbaik untuk deployment VPS

  // Izinkan perangkat satu jaringan mengakses asset dev server saat testing QR.
  allowedDevOrigins: ["192.168.1.4"],
};

export default nextConfig;
