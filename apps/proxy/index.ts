/** biome-ignore-all lint/suspicious/noConsole: Proxy startup diagnostics */
import { createProxy, readRateLimit } from "./proxy"

const TARGET_URL = process.env.PROXY_TARGET || "https://portal.midis.info"
const PORT = process.env.PORT || 3000
const rateLimit = readRateLimit()

const server = Bun.serve({
	port: PORT,
	fetch: createProxy({ target: TARGET_URL, rateLimit }),
})

console.log(`🚀 Proxy server running on http://localhost:${server.port}`)
console.log(`📡 Forwarding requests to: ${TARGET_URL}`)
console.log(`Rate limit: ${rateLimit} requests/second; cache TTL: 10 minutes`)
