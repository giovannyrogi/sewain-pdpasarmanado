import { NextResponse } from "next/server";

export async function POST(req) {
  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.set("loggedInUser", "", {
    expires: new Date(0),
    path: "/",
  });
  return response;
}
