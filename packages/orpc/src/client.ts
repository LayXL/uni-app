import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import {
	LEGACY_TEST_TIME_OFFSET_DAYS_STORAGE_KEY,
	parseTestTimeOffsetDaysAsHours,
	parseTestTimeOffsetHours,
	TEST_TIME_OFFSET_HOURS_HEADER,
	TEST_TIME_OFFSET_HOURS_STORAGE_KEY,
} from "@repo/shared/time/test-time"

import type { Context } from "./base"
import type { router } from "./router"

const link = new RPCLink<Context>({
	url: () => {
		if (typeof window !== "undefined") {
			return process.env.NEXT_PUBLIC_ORPC_URL ?? `${window.location.origin}/rpc`
		}

		return (
			process.env.SERVER_ORPC_URL ??
			process.env.NEXT_PUBLIC_ORPC_URL ??
			"http://localhost:3000/rpc"
		)
	},
	headers: ({ context }) => {
		const headers = context.headers
			? new Headers(context.headers)
			: new Headers()

		if (typeof window !== "undefined") {
			const offsetHours =
				parseTestTimeOffsetHours(
					window.localStorage.getItem(TEST_TIME_OFFSET_HOURS_STORAGE_KEY),
				) ||
				parseTestTimeOffsetDaysAsHours(
					window.localStorage.getItem(LEGACY_TEST_TIME_OFFSET_DAYS_STORAGE_KEY),
				)

			if (offsetHours !== 0) {
				headers.set(TEST_TIME_OFFSET_HOURS_HEADER, offsetHours.toString())
			}
		}

		return headers
	},
})

export const client: RouterClient<typeof router> = createORPCClient(link)
