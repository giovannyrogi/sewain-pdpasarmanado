import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { syncExpiredRooms } from "@/app/utils/roomStatusSync";

const getBearerToken = (request) => {
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
};

const safeCompareSecret = (received, expected) => {
  if (!received || !expected) return false;

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
};

/**
 * Endpoint khusus cron VPS.
 * Tidak memakai session browser; akses hanya valid jika bearer token cocok
 * dengan ROOM_SYNC_CRON_SECRET di server.
 */
export async function POST(request) {
  const expectedSecret = process.env.ROOM_SYNC_CRON_SECRET;

  if (!expectedSecret) {
    console.error("ROOM_SYNC_CRON_SECRET belum dikonfigurasi.");
    return NextResponse.json(
      { success: false, message: "Konfigurasi sinkronisasi belum lengkap." },
      { status: 500 },
    );
  }

  const token = getBearerToken(request);

  if (!safeCompareSecret(token, expectedSecret)) {
    return NextResponse.json(
      { success: false, message: "Akses cron tidak valid." },
      { status: 401 },
    );
  }

  try {
    const result = await syncExpiredRooms({ triggerSource: "cron" });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Cron sync expired rooms gagal:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menjalankan sinkronisasi ruangan." },
      { status: 500 },
    );
  }
}
