import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	const queryString = request.nextUrl.searchParams.toString()

	const host = request.headers.get("host") ?? "localhost:3000"
	const protocol = request.headers.get("x-forwarded-proto") ?? "http"
	const response = NextResponse.redirect(new URL("/", `${protocol}://${host}`))

	if (queryString.length > 0) {
		response.cookies.set("session", `vkma ${queryString}`, {
			expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			path: "/",
			httpOnly: true,
			sameSite: "none",
			secure: true,
		})
	}

	return response
}
