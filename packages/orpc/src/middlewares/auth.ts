import { ORPCError } from "@orpc/client"
import { parse, validate } from "@tma.js/init-data-node"

import { db, eq, usersTable } from "@repo/drizzle"
import { env } from "@repo/env"

import { base, type Context } from "../base"

function decodeNestedURIComponent(value: string) {
	let current = value
	let previous: string | undefined

	while (previous !== current) {
		try {
			previous = current
			current = decodeURIComponent(current)
		} catch {
			return current
		}
	}

	return current
}

function authTokenStringToSearchParams(rawAuthToken: string) {
	const decoded = decodeNestedURIComponent(rawAuthToken)

	return new URLSearchParams(decoded)
}

function getAuthorizationHeader(context: Context) {
	const [authType, authToken] =
		context.headers?.get("authorization")?.split(" ") ?? []

	return { authType, authToken }
}

export const authMiddleware = base.middleware(async ({ context, next }) => {
	const { authType, authToken } = getAuthorizationHeader(context)

	if (authType === "tma") {
		if (!authToken) throw new ORPCError("UNAUTHORIZED")

		const searchParams = authTokenStringToSearchParams(authToken)

		validate(searchParams, env.botToken, {
			expiresIn: 60 * 60 * 24,
		})

		const initData = parse(searchParams)

		if (!initData.user?.id) throw new ORPCError("UNAUTHORIZED")

		const [user] = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.telegramId, initData.user.id))
			.limit(1)

		if (!user) {
			await db
				.insert(usersTable)
				.values({
					telegramId: initData.user.id,
				})
				.returning()

			return next({
				context: {
					user,
				},
			})
		}

		return next({
			context: {
				user,
			},
		})
	}

	throw new ORPCError("UNAUTHORIZED")
})
