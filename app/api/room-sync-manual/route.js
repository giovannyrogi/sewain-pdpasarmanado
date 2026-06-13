import { NextResponse } from "next/server";
import { requireRole } from "@/app/utils/auth";
import { syncExpiredRooms } from "@/app/utils/roomStatusSync";

const SUPERADMIN_ROLE_ID = 1;

/**
 * Trigger manual dari menu superadmin.
 * Actor diambil dari session login, bukan dari body request.
 */
export async function POST() {
  const { user, response } = await requireRole([SUPERADMIN_ROLE_ID]);
  if (response) return response;

  try {
    const result = await syncExpiredRooms({
      triggerSource: "manual",
      executedBy: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Manual sync expired rooms gagal:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menjalankan sinkronisasi ruangan." },
      { status: 500 },
    );
  }
}
