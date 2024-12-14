import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|unavailable|admin|payload-api).*)",
  ],
}
