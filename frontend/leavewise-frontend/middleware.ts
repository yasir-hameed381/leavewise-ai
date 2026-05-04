import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isHrRole(role: string | undefined) {
  return role === "HR" || role === "ADMIN";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("leavewise_role")?.value;
  const token = request.cookies.get("leavewise_token")?.value;
  const authenticatedHr = Boolean(token) && isHrRole(role);

  if (pathname.startsWith("/hr/dashboard") && !authenticatedHr) {
    return NextResponse.redirect(new URL("/hr/login", request.url));
  }

  if (pathname.startsWith("/hr/login") && authenticatedHr) {
    return NextResponse.redirect(new URL("/hr/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/hr/login", "/hr/dashboard/:path*"],
};
