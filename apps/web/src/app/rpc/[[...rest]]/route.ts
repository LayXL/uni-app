import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"

export const dynamic = "force-dynamic"

async function handleRequest(request: Request) {
	const { router } = await import("@repo/orpc/router")

	const handler = new RPCHandler(router, {
		interceptors: [
			onError((error) => {
				console.error("Caught internal error:", error)
			}),
		],
	})

	const headers = new Headers(request.headers)

	const cookie = request.headers.get("cookie")

	const session = decodeURIComponent(
		cookie
			?.split("; ")
			.find((cookie) => cookie.startsWith("session="))
			?.split("=")[1] ?? "",
	)

	if (session.length > 0) {
		headers.set("authorization", session)
	}

	const { response } = await handler.handle(request, {
		prefix: "/rpc",
		context: { headers },
	})

	return response ?? new Response("Not found", { status: 404 })
}

export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
