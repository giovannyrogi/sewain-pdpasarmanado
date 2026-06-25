import {
  getLandPermitVerificationByToken,
  isValidLandPermitQrToken,
} from "@/app/utils/landPermitVerificationService";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 80;
const buckets = new Map();

const getClientKey = (request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")?.[0]?.trim() || "local";
};

const cleanupExpiredBuckets = (now) => {
  if (buckets.size < 1000) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

const isRateLimited = (request) => {
  const key = getClientKey(request);
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_REQUESTS;
};

export async function GET(request, { params }) {
  try {
    if (isRateLimited(request)) {
      return Response.json(
        {
          success: false,
          message: "Terlalu banyak percobaan. Silakan coba beberapa saat lagi.",
        },
        { status: 429 },
      );
    }

    const { token: rawToken } = await params;
    const token = String(rawToken || "").trim();

    if (!isValidLandPermitQrToken(token)) {
      return Response.json(
        {
          success: false,
          message: "Kode QR tidak valid.",
        },
        { status: 400 },
      );
    }

    const data = await getLandPermitVerificationByToken(token);

    if (!data) {
      return Response.json(
        {
          success: false,
          message: "Dokumen izin lahan tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Data validasi dokumen izin lahan berhasil diambil.",
      data,
    });
  } catch (error) {
    console.error("Error fetching public land permit verification:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memvalidasi dokumen izin lahan.",
      },
      { status: 500 },
    );
  }
}
