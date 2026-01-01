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
		ctx.user = await db
			.insert(usersTable)
			.values({ telegramId: ctx.from.id })
			.returning()
			.then(([user]) => user)

		return next()
	}

	ctx.user = user

	next()
}
