import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import type { Context } from "./base"
import type { router } from "./router"

const link = new RPCLink<Context>({
	url: () => {
		if (typeof window !== "undefined") {
			return process.env.NEXT_PUBLIC_ORPC_URL ?? `${window.location.origin}/rpc`
		}

		return process.env.NEXT_PUBLIC_ORPC_URL ?? "http://localhost:3000/rpc"
	},
	headers: ({ context }) => {
		if (context.headers) {
			return context.headers
		}

		return new Headers()
	},
})

export const client: RouterClient<typeof router> = createORPCClient(link)
