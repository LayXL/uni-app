import { os } from "@orpc/server"

export type Context = {
	headers?: Headers
}

export const base = os.$context<Context>()
