import { NextResponse } from "next/server";
import MENU_CONFIG from "./app/components/menu/MenuConfig";
import { getDefaultRouteByRole } from "./app/utils/defaultRouteByRole";

const buildAccessMap = (menus) => {
  const map = {};

  const traverse = (items) => {
    items.forEach((item) => {
      if (item.path) {
        map[item.path] = item.roles;
      }

      if (item.submenu) {
        traverse(item.submenu);
      }
    });
  };

  traverse(menus);
  return map;
};

const ACCESS_MAP = buildAccessMap(MENU_CONFIG);
const PUBLIC_PATHS = ["/login"];
const PUBLIC_PATH_PREFIXES = ["/verify/izin-lahan"];

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.includes(pathname) ||
  PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

const clearLoginCookie = (response) => {
  response.cookies.set("loggedInUser", "", {
    expires: new Date(0),
    path: "/",
  });
  return response;
};

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const loggedInUser = req.cookies.get("loggedInUser");
  const publicPath = isPublicPath(pathname);

  if (publicPath && pathname !== "/login") {
    return NextResponse.next();
  }

  if (!loggedInUser && !publicPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!loggedInUser) {
    return NextResponse.next();
  }

  let user;
  try {
    user = JSON.parse(loggedInUser.value);
  } catch {
    return clearLoginCookie(
      NextResponse.redirect(new URL("/login", req.url)),
    );
  }

  /**
   * `expiresAt` adalah batas sesi aplikasi yang dipakai API untuk menolak akses.
   * Cookie sengaja punya grace singkat agar shell protected masih bisa memuat
   * modal expired session, lalu client melakukan countdown dan redirect login.
   */
  const isExpired =
    user?.expiresAt && Date.now() > Number(user.expiresAt);

  if (isExpired) {
    if (pathname === "/login") {
      return clearLoginCookie(NextResponse.next());
    }

    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL(getDefaultRouteByRole(user.role_id), req.url));
  }

  const matchedPath = Object.keys(ACCESS_MAP).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!matchedPath) {
    return NextResponse.redirect(new URL(getDefaultRouteByRole(user.role_id), req.url));
  }

  if (!ACCESS_MAP[matchedPath].includes(user.role_id)) {
    return NextResponse.redirect(new URL(getDefaultRouteByRole(user.role_id), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|doc|docx|pdf)).*)",
  ],
};
