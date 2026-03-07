import { db, eq, usersTable } from "@repo/drizzle"
import { env } from "@repo/env"

import { forceSendDailyScheduleNotifications } from "../services/daily-schedule-notifications"
import { Composer } from "../types/composer"

export const setupComposer = new Composer()

const parseForceNotificationsDate = (value: string) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return undefined
	}

	const parsed = new Date(`${value}T00:00:00.000Z`)
	if (Number.isNaN(parsed.getTime())) {
		return undefined
	}

	return parsed.toISOString().slice(0, 10) === value ? value : undefined
}

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

setupComposer.command("forceNotifications", async (ctx) => {
	if (!ctx.user?.isAdmin) {
		return ctx.reply("У тебя нет доступа к этой команде")
	}

	const argument = ctx.match?.toString().trim()
	const customDate = argument ? parseForceNotificationsDate(argument) : undefined

	if (argument && !customDate) {
		return ctx.reply(
			"Неверный формат даты. Используй: /forceNotifications YYYY-MM-DD",
		)
	}

	const result = await forceSendDailyScheduleNotifications(customDate)

	if (result.status === "alreadyRunning") {
		return ctx.reply("Рассылка уже выполняется")
	}

	await ctx.reply(
		`Принудительная рассылка на ${result.targetDate} завершена. Отправлено: ${result.sentCount}`,
	)
})
