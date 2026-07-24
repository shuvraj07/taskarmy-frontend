import { NextRequest, NextResponse } from "next/server";
import { isTokenExpired } from "@/features/auth";

export const config = {
  matcher: ["/client/:path*", "/tasker/:path*"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = pathname.startsWith("/client")
    ? "client"
    : pathname.startsWith("/tasker")
      ? "tasker"
      : null;

  if (!role) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get(`${role}_token`);
  if (!tokenCookie?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isTokenExpired(tokenCookie.value)) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(`${role}_token`);
    return response;
  }

  return NextResponse.next();
}
