import type { Api } from "grammy"

import { asc, db, eq, lte, sql, userFeedbackTable } from "@repo/drizzle"
import { env } from "@repo/env"
import { formatUserFeedback } from "@repo/shared/format-user-feedback"

const CHECK_INTERVAL_MS = 10_000
const BATCH_SIZE = 20
let isStarted = false

export const sendPendingFeedback = async (
	api: Pick<Api, "sendMessage">,
	database = db,
	chatId = env.botForwardChatId,
) => {
	if (!chatId) return

	for (let index = 0; index < BATCH_SIZE; index++) {
		const sent = await database.transaction(async (tx) => {
			// Keep the row locked until delivery is recorded. Other bot instances
			// skip it, and edits cannot be accidentally cleared by this delivery.
			const [feedback] = await tx
				.select()
				.from(userFeedbackTable)
				.where(lte(userFeedbackTable.notificationDueAt, sql`now()`))
				.orderBy(asc(userFeedbackTable.notificationDueAt))
				.limit(1)
				.for("update", { skipLocked: true })

			if (!feedback) return false

			await api.sendMessage(chatId, formatUserFeedback(feedback))
			await tx
				.update(userFeedbackTable)
				.set({ notificationDueAt: null })
				.where(eq(userFeedbackTable.id, feedback.id))
			return true
		})

		if (!sent) break
	}
}

export const startFeedbackNotifications = (api: Pick<Api, "sendMessage">) => {
	if (isStarted || !env.botForwardChatId) return
	isStarted = true

	const tick = async () => {
		try {
			await sendPendingFeedback(api)
		} catch {
			// Failed deliveries remain pending and are retried on the next tick.
			// biome-ignore lint/suspicious/noConsole: Report delivery failures without exposing the bot token.
			console.error("Failed to send feedback notifications")
		} finally {
			setTimeout(() => void tick(), CHECK_INTERVAL_MS)
		}
	}

	void tick()
}
