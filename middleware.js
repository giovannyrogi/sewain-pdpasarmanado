// middleware.js
import { NextResponse } from "next/server";
import { ROLES } from "./app/components/menu/ConstantRoles";

const roleAccessMap = {
  "/dashboard": Object.values(ROLES),

  floor: [ROLES.DIVISI_KONTRAK],
  "/identity-list": [ROLES.DIVISI_KONTRAK],
  "/rooms": [ROLES.DIVISI_KONTRAK],
  "/locations": [ROLES.DIVISI_KONTRAK],
  "/contracts": [ROLES.DIVISI_KONTRAK],
  "/tenant-approval": [ROLES.DIREKTUR_BISNIS, ROLES.DIREKTUR_UTAMA],
  "/tenant-terminations": [
    ROLES.DIVISI_KONTRAK,
    ROLES.DIREKTUR_BISNIS,
    ROLES.DIREKTUR_UTAMA,
  ],
  "/tenant-terminations-approval": [
    ROLES.DIVISI_KONTRAK,
    ROLES.DIREKTUR_BISNIS,
    ROLES.DIREKTUR_UTAMA,
  ],
  "/transactions": [ROLES.DIVISI_KONTRAK],
  "/tenant-application": [ROLES.DIVISI_KONTRAK],
  "/payments": [ROLES.DIVISI_KONTRAK, ROLES.DIVISI_KEUANGAN],
  "/tenants-report": [
    ROLES.DIVISI_KONTRAK,
    ROLES.KEPALA_DIVISI,
    ROLES.DIREKTUR_BISNIS,
    ROLES.DIREKTUR_UTAMA,
    ROLES.DIVISI_KEUANGAN,
  ],
  "/locations-report": [
    ROLES.DIVISI_KONTRAK,
    ROLES.KEPALA_DIVISI,
    ROLES.DIREKTUR_BISNIS,
    ROLES.DIREKTUR_UTAMA,
    ROLES.DIVISI_KEUANGAN,
  ],
};

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const loggedInUser = req.cookies.get("loggedInUser");

  // BELUM LOGIN → paksa ke /login
  if (!loggedInUser && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // SUDAH LOGIN
  if (loggedInUser) {
    let user;

    try {
      user = JSON.parse(loggedInUser.value);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // CEK EXPIRED SESSION
    // if (Date.now() > user.expiresAt) {
    //   const res = NextResponse.redirect(new URL("/login", req.url));
    //   res.cookies.delete("loggedInUser");
    //   return res;
    // }

    // SUDAH LOGIN → TIDAK BOLEH KE /login
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // CEK AKSES ROLE
    for (const path in roleAccessMap) {
      if (pathname.startsWith(path)) {
        if (!roleAccessMap[path].includes(user.role_id)) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/reports/:path*",
    "/floor",
    "/contracts",
    "/tenant-approval",
    "/tenant-terminations",
    "/payments",
    "/transactions",
    "/tenant-terminations-approval",
    "/tenant-application",
    "/identity-list",
    "/rooms",
    "/locations",
    "/tenants-report",
    "/locations-report",
  ],
};
