import { db, eq, usersTable } from "@repo/drizzle"
import { env } from "@repo/env"

import { Composer } from "../types/composer"

export const setupComposer = new Composer()

setupComposer.command("setup", async (ctx) => {
	if (!ctx.user?.isAdmin) {
		return ctx.reply("У тебя нет доступа к этой команде")
	}

	await Promise.all([
		ctx.api.setMyName("МИДИС"),
		ctx.api.setMyDescription(
			"Экономлю твое время с расписанием и картой МИДИС",
		),
	])

	await ctx.reply("Настройки бота успешно обновлены")
})

setupComposer.command("setMeAdmin", async (ctx) => {
	if (!ctx.from?.id || env.nodeEnv !== "development") {
		return
	}

	await db
		.update(usersTable)
		.set({ isAdmin: true })
		.where(eq(usersTable.telegramId, ctx.from.id))

	await ctx.reply("Теперь ты админ")
})
