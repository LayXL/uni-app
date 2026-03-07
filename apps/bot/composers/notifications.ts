import { db, eq, usersTable } from "@repo/drizzle"

import { forceSendDailyScheduleNotifications } from "../services/daily-schedule-notifications"
import { Composer } from "../types/composer"

export const notificationsComposer = new Composer()

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

notificationsComposer.command("subscribe", async (ctx) => {
	if (!ctx.user) {
		return
	}

	await db
		.update(usersTable)
		.set({ isEnabledNotifications: true })
		.where(eq(usersTable.id, ctx.user.id))

	ctx.user.isEnabledNotifications = true
	await ctx.reply(
		"Уведомления включены. Теперь ты будешь получать уведомления о парах на завтра в 18:00. Отписаться от уведомлений — /unsubscribe",
	)
})

notificationsComposer.command("unsubscribe", async (ctx) => {
	if (!ctx.user) {
		return
	}

	await db
		.update(usersTable)
		.set({ isEnabledNotifications: false })
		.where(eq(usersTable.id, ctx.user.id))

	ctx.user.isEnabledNotifications = false
	await ctx.reply(
		"Уведомления выключены. Чтобы включить снова, используй /subscribe",
	)
})

notificationsComposer.command("forceNotifications", async (ctx) => {
	if (!ctx.user?.isAdmin) {
		return ctx.reply("У тебя нет доступа к этой команде")
	}

	const argument = ctx.match?.toString().trim()
	const customDate = argument
		? parseForceNotificationsDate(argument)
		: undefined

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
