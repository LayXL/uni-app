import { createFileRoute } from "@tanstack/react-router"

import { handleRpcRequest } from "@/server/rpc-handler"

export const Route = createFileRoute("/rpc/$")({
	server: {
		handlers: {
			HEAD: ({ request }) => handleRpcRequest(request),
			GET: ({ request }) => handleRpcRequest(request),
			POST: ({ request }) => handleRpcRequest(request),
			PUT: ({ request }) => handleRpcRequest(request),
			PATCH: ({ request }) => handleRpcRequest(request),
			DELETE: ({ request }) => handleRpcRequest(request),
		},
	},
})
