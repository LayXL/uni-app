/** biome-ignore-all lint/suspicious/noConsole: cause why not */

const TARGET_URL = process.env.PROXY_TARGET || "https://portal.midis.info"
const PORT = process.env.PORT || 3000

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		console.log("fetch request", req.url)

		const url = new URL(req.url)

		const targetUrl = new URL(url.pathname + url.search, TARGET_URL)

		const headers = new Headers(req.headers)
		headers.set("host", targetUrl.host)

		headers.delete("accept-encoding")
		headers.delete("content-length")

		try {
			const response = await fetch(targetUrl.toString(), {
				method: req.method,
				headers: headers,
				body: req.body,
			})

			const responseBody = await response.arrayBuffer()

			const responseHeaders = new Headers(response.headers)

			responseHeaders.delete("content-encoding")
			responseHeaders.delete("transfer-encoding")

			responseHeaders.set("content-length", responseBody.byteLength.toString())

			console.log(responseBody)

			return new Response(responseBody, {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders,
			})
		} catch (error) {
			console.error("Proxy error:", error)
			return new Response("Proxy Error", { status: 502 })
		}
	},
})

console.log(`🚀 Proxy server running on http://localhost:${server.port}`)
console.log(`📡 Forwarding requests to: ${TARGET_URL}`)
