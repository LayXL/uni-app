import * as Sentry from "@sentry/tanstackstart-react"
import handler, {
	createServerEntry,
	type ServerEntry,
} from "@tanstack/react-start/server-entry"

Sentry.init({
	dsn: "https://df2dbf351aa540a89eb7cbf1821ef945@glitchtip.layxl.dev/1",
	tracesSampleRate: 0.01,
})

const LEGACY_HOSTNAME = "midis.layxl.dev"
const CACHE_FOR_ONE_WEEK = "public, max-age=604800, immutable"
const CACHE_FOR_ONE_YEAR = "public, max-age=31536000, immutable"

const getHostname = (host: string | null) =>
	host?.split(",")[0]?.trim().toLowerCase().split(":")[0]

const isLegacyRewriteCandidate = (pathname: string) =>
	!pathname.startsWith("/rpc") &&
	!pathname.startsWith("/assets/") &&
	!pathname.startsWith("/lottie/") &&
	!pathname.startsWith("/icons/") &&
	pathname !== "/favicon.ico"

const withCompatibilityHeaders = (request: Request, response: Response) => {
	const headers = new Headers(response.headers)
	const pathname = new URL(request.url).pathname

	headers.set("Access-Control-Allow-Origin", "*")
	headers.set("Access-Control-Allow-Credentials", "true")

	if (pathname.endsWith(".svg")) {
		headers.set("Content-Type", "image/svg+xml")
		headers.set("Cache-Control", CACHE_FOR_ONE_WEEK)
	}

	if (pathname === "/images/secretscode-channel-v2.webp") {
		headers.set("Cache-Control", CACHE_FOR_ONE_YEAR)
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	})
}

const serverEntry: ServerEntry = {
	async fetch(request) {
		const url = new URL(request.url)
		const forwardedHost = request.headers.get("x-forwarded-host")
		const host = forwardedHost ?? request.headers.get("host")
		let routedRequest = request

		if (
			getHostname(host) === LEGACY_HOSTNAME &&
			isLegacyRewriteCandidate(url.pathname)
		) {
			url.pathname = "/legacy-domain"
			url.search = ""
			routedRequest = new Request(url, request)
		}

		try {
			const response = await handler.fetch(routedRequest)
			return withCompatibilityHeaders(request, response)
		} catch (error) {
			Sentry.captureException(error)
			throw error
		}
	},
}

export default createServerEntry(serverEntry)
