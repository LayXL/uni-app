import { createHmac } from "node:crypto"
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
		decodeURIComponent(
			context.headers
				?.get("cookie")
				?.split(";")
				.find((cookie) => cookie.trim().startsWith("session="))
				?.replace("session=", "") ?? "",
		)
			?.trim()
			.split(" ") ?? []

	return { authType, authToken }
}

export const authMiddleware = base.middleware(async ({ context, next }) => {
	const { authType, authToken } = getAuthorizationHeader(context)

	if (authType === "tma") {
		if (!authToken) throw new ORPCError("UNAUTHORIZED")

		const searchParams = authTokenStringToSearchParams(authToken)

		if (process.env.NODE_ENV === "production") {
			try {
				validate(searchParams, env.botToken, { expiresIn: 60 * 60 * 24 })
			} catch {
				throw new ORPCError("UNAUTHORIZED")
			}
		}

		const initData = parse(searchParams)

		if (!initData.user?.id) throw new ORPCError("UNAUTHORIZED")

		const [user] = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.telegramId, initData.user.id))
			.limit(1)

		if (!user) {
			const [newUser] = await db
				.insert(usersTable)
				.values({ telegramId: initData.user.id })
				.onConflictDoNothing({ target: usersTable.telegramId })
				.returning()

			if (newUser) {
				return next({ context: { user: newUser } })
			}

			const [existingUser] = await db
				.select()
				.from(usersTable)
				.where(eq(usersTable.telegramId, initData.user.id))
				.limit(1)

			if (!existingUser) throw new ORPCError("INTERNAL_SERVER_ERROR")

			return next({ context: { user: existingUser } })
		}

		return next({ context: { user } })
	} else if (authType === "vkma") {
		if (!authToken) throw new ORPCError("UNAUTHORIZED")

		const searchParams = authTokenStringToSearchParams(authToken)

		if (process.env.NODE_ENV === "production") {
			const sign = searchParams.get("sign")
			if (!sign) throw new ORPCError("UNAUTHORIZED")

			const vkParams = [...searchParams.entries()]
				.filter(([key]) => key.startsWith("vk_"))
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, value]) => `${key}=${value}`)
				.join("&")

			const hmac = createHmac("sha256", env.vkClientSecret)
				.update(vkParams)
				.digest("base64url")

			if (hmac !== sign) throw new ORPCError("UNAUTHORIZED")
		}

		const vkUserId = Number(searchParams.get("vk_user_id"))
		if (!vkUserId || Number.isNaN(vkUserId)) throw new ORPCError("UNAUTHORIZED")

		const [user] = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.vkId, vkUserId))
			.limit(1)

		if (!user) {
			const [newUser] = await db
				.insert(usersTable)
				.values({ vkId: vkUserId })
				.onConflictDoNothing({ target: usersTable.vkId })
				.returning()

			if (!newUser) {
				const [existingUser] = await db
					.select()
					.from(usersTable)
					.where(eq(usersTable.vkId, vkUserId))
					.limit(1)

				if (!existingUser) throw new ORPCError("INTERNAL_SERVER_ERROR")

				return next({ context: { user: existingUser } })
			}

			return next({ context: { user: newUser } })
		}

		return next({ context: { user } })
	}

	throw new ORPCError("UNAUTHORIZED")
})
