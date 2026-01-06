// middleware.js
import { NextResponse } from "next/server";
import MENU_CONFIG from "./app/components/menu/MenuConfig";

// build access map dari MENU_CONFIG
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

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const loggedInUser = req.cookies.get("loggedInUser");

  // BELUM LOGIN
  if (!loggedInUser && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (loggedInUser) {
    let user;
    try {
      user = JSON.parse(loggedInUser.value);
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // SUDAH LOGIN → BLOCK /login
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // CEK AKSES ROUTE
    const matchedPath = Object.keys(ACCESS_MAP).find(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // route tidak terdaftar → BLOCK
    if (!matchedPath) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // role tidak punya akses → BLOCK
    if (!ACCESS_MAP[matchedPath].includes(user.role_id)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js)).*)",
  ],
};
