import { createHash } from "node:crypto"

const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_CACHE_BYTES = 64 * 1024 * 1024
const MAX_CACHE_ENTRIES = 1000
const READ_POST_PATHS = new Set([
	"/local/handlers/schedule/groups.php",
	"/local/handlers/schedule/users.php",
])

type StoredResponse = {
	body: ArrayBuffer
	status: number
	statusText: string
	headers: Headers
}

export function readRateLimit(value = process.env.PROXY_RATE_LIMIT_RPS) {
	const limit = value === undefined ? 2 : Number(value)
	if (!Number.isSafeInteger(limit) || limit < 1) {
		throw new Error("PROXY_RATE_LIMIT_RPS must be a positive integer")
	}
	return limit
}

export function createProxy({
	target,
	rateLimit = 2,
	fetchUpstream = fetch,
	now = () => performance.now(),
}: {
	target: string
	rateLimit?: number
	fetchUpstream?: (url: string, init: RequestInit) => Promise<Response>
	now?: () => number
}) {
	readRateLimit(String(rateLimit))
	const requests: number[] = []
	const cache = new Map<string, StoredResponse & { expiresAt: number }>()
	const pending = new Map<string, Promise<StoredResponse>>()
	let cacheBytes = 0

	function remove(key: string) {
		const entry = cache.get(key)
		if (entry) cacheBytes -= entry.body.byteLength
		cache.delete(key)
	}

	function restore(response: StoredResponse, method: string) {
		return new Response(
			method === "HEAD" || [204, 205, 304].includes(response.status)
				? null
				: response.body.slice(0),
			response,
		)
	}

	return async (req: Request): Promise<Response> => {
		try {
			const url = new URL(req.url)
			const targetUrl = new URL(target)
			targetUrl.pathname = url.pathname
			targetUrl.search = url.search
			const headers = new Headers(req.headers)
			headers.set("host", targetUrl.host)
			headers.delete("accept-encoding")
			headers.delete("content-length")

			const cacheable =
				req.method === "GET" ||
				req.method === "HEAD" ||
				(req.method === "POST" && READ_POST_PATHS.has(url.pathname))
			const body = cacheable && req.body ? await req.arrayBuffer() : req.body
			const key = cacheable
				? createHash("sha256")
						.update(JSON.stringify([req.method, targetUrl.href, [...headers]]))
						.update(body instanceof ArrayBuffer ? new Uint8Array(body) : "")
						.digest("hex")
				: undefined

			const timestamp = now()
			for (const [cachedKey, entry] of cache) {
				if (entry.expiresAt <= timestamp) remove(cachedKey)
			}
			if (key) {
				const cached = cache.get(key)
				if (cached) return restore(cached, req.method)
				const inFlight = pending.get(key)
				if (inFlight) return restore(await inFlight, req.method)
			}

			while (requests[0] !== undefined && requests[0] <= timestamp - 1000) {
				requests.shift()
			}
			if (requests.length >= rateLimit) {
				return new Response("Too Many Requests", {
					status: 429,
					headers: { "Retry-After": "1", "Cache-Control": "no-store" },
				})
			}
			requests.push(timestamp)

			const load = async (): Promise<StoredResponse> => {
				const response = await fetchUpstream(targetUrl.href, {
					method: req.method,
					headers,
					body,
				})
				const responseBody = await response.arrayBuffer()
				const responseHeaders = new Headers(response.headers)
				responseHeaders.delete("content-encoding")
				responseHeaders.delete("transfer-encoding")
				responseHeaders.set("content-length", String(responseBody.byteLength))
				const stored = {
					body: responseBody,
					status: response.status,
					statusText: response.statusText,
					headers: responseHeaders,
				}
				if (
					key &&
					response.ok &&
					!responseHeaders.has("set-cookie") &&
					!/(?:^|,)\s*(?:no-store|no-cache)\b/i.test(
						responseHeaders.get("cache-control") ?? "",
					) &&
					responseHeaders.get("vary")?.trim() !== "*" &&
					responseBody.byteLength <= MAX_CACHE_BYTES
				) {
					while (
						cache.size >= MAX_CACHE_ENTRIES ||
						cacheBytes + responseBody.byteLength > MAX_CACHE_BYTES
					) {
						const oldestKey = cache.keys().next().value
						if (oldestKey === undefined) break
						remove(oldestKey)
					}
					cache.set(key, { ...stored, expiresAt: now() + CACHE_TTL_MS })
					cacheBytes += responseBody.byteLength
				}
				return stored
			}

			const result = load()
			if (key) pending.set(key, result)
			try {
				return restore(await result, req.method)
			} finally {
				if (key) pending.delete(key)
			}
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: Proxy operational diagnostics
			console.error("Proxy error:", error)
			return new Response("Proxy Error", { status: 502 })
		}
	}
}
