import { onError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"

import { isUnauthorizedError } from "@/shared/utils/is-unauthorized-error"

function decodeURIComponentSafe(value: string) {
	try {
		return decodeURIComponent(value)
	} catch {
		return ""
	}
}

export async function handleRpcRequest(request: Request) {
	const { router } = await import("@repo/orpc/router")
	const handler = new RPCHandler(router, {
		interceptors: [
			onError((error) => {
				if (isUnauthorizedError(error)) return

				// biome-ignore lint/suspicious/noConsole: server-side RPC error logging
				console.error("Caught internal error:", error)
			}),
		],
	})
	const headers = new Headers(request.headers)
	const cookie = request.headers.get("cookie")
	const session = decodeURIComponentSafe(
		cookie
			?.split("; ")
			.find((item) => item.startsWith("session="))
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
