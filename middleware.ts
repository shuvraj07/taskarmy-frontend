import { NextRequest, NextResponse } from "next/server";
import { isTokenExpired } from "@/lib/session-store";

export const config = {
  matcher: ["/tasker/:path*", "/taskarmy/:path*"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = pathname.startsWith("/tasker")
    ? "tasker"
    : pathname.startsWith("/taskarmy")
      ? "taskarmy"
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
