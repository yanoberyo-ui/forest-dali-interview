import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware disabled - admin pages are publicly accessible
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
