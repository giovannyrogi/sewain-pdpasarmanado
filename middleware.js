import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const loggedInUser = req.cookies.get("loggedInUser");

  const protectedPaths = [
    "/superadmin",
    "/divisi-kontrak",
    "/kepala-seksi",
    "/kepala-subdivisi",
    "/kepala-divisi",
    "/direktur-bisnis",
    "/direktur-utama",
  ];

  // --- Kalau belum login & akses protected page → redirect login
  if (!loggedInUser && protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (loggedInUser) {
    const user = JSON.parse(loggedInUser.value);

    // --- Kalau sudah login & buka /login → redirect ke dashboard sesuai role
    if (pathname === "/login") {
      let redirectPath = "/login";

      switch (user.role_id) {
        case 1:
          redirectPath = "/superadmin/dashboard";
          break;
        case 2:
          redirectPath = "/divisi-kontrak/dashboard";
          break;
        case 3:
          redirectPath = "/kepala-seksi/dashboard";
          break;
        case 4:
          redirectPath = "/kepala-subdivisi/dashboard";
          break;
        case 5:
          redirectPath = "/kepala-divisi/dashboard";
          break;
        case 6:
          redirectPath = "/direktur-bisnis/dashboard";
          break;
        case 7:
          redirectPath = "/direktur-utama/dashboard";
          break;
      }

      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // --- Tambahkan cek role_id vs path
    const rolePathMap = {
      1: "/superadmin",
      2: "/divisi-kontrak",
      3: "/kepala-seksi",
      4: "/kepala-subdivisi",
      5: "/kepala-divisi",
      6: "/direktur-bisnis",
      7: "/direktur-utama",
    };

    // Jika path diawali dengan protected path tapi bukan sesuai role → redirect ke dashboard sendiri
    for (const path of protectedPaths) {
      if (pathname.startsWith(path) && path !== rolePathMap[user.role_id]) {
        return NextResponse.redirect(
          new URL(rolePathMap[user.role_id] + "/dashboard", req.url)
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/superadmin/:path*",
    "/divisi-kontrak/:path*",
    "/kepala-seksi/:path*",
    "/kepala-subdivisi/:path*",
    "/kepala-divisi/:path*",
    "/direktur-bisnis/:path*",
    "/direktur-utama/:path*",
  ],
};
