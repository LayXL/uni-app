import type { NextFunction } from "grammy"

import { db, eq, usersTable } from "@repo/drizzle"

import type { Context } from "../types/context"

export const userMiddleware = async (ctx: Context, next: NextFunction) => {
	if (!ctx.from?.id) {
		return next()
	}

	const user = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.telegramId, ctx.from.id))
		.limit(1)
		.then(([user]) => user)

	if (!user) {
		const newUser = await db
			.insert(usersTable)
			.values({ telegramId: ctx.from.id })
			.onConflictDoNothing({ target: usersTable.telegramId })
			.returning()
			.then(([user]) => user)

		if (newUser) {
			ctx.user = newUser
			return next()
		}

		ctx.user = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.telegramId, ctx.from.id))
			.limit(1)
			.then(([user]) => user)

		if (!ctx.user) {
			throw new Error("Failed to load user after conflict insert")
		}

		return next()
	}

	ctx.user = user

	next()
}
