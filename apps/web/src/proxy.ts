import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const LEGACY_HOSTNAME = "midis.layxl.dev"

const getHostname = (host: string | null) =>
	host?.split(",")[0]?.trim().toLowerCase().split(":")[0]

export function proxy(request: NextRequest) {
	const host =
		request.headers.get("x-forwarded-host") ?? request.headers.get("host")

	if (getHostname(host) !== LEGACY_HOSTNAME) {
		return NextResponse.next()
	}

	const url = request.nextUrl.clone()
	url.pathname = "/legacy-domain"
	url.search = ""

	return NextResponse.rewrite(url)
}

export const config = {
	matcher: ["/((?!rpc|_next/static|_next/image|favicon.ico|lottie/|icons/).*)"],
}
