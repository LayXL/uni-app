import { env } from "@repo/env"
import { USER_FEEDBACK_REASONS } from "@repo/shared/user-feedback"

export const notifyFeedback = async (feedback: {
	rating: number
	reasons: string[]
	comment: string
	group: number | null
	platform: string
}) => {
	if (!env.telegramFeedbackChatId) return

	const reasons = feedback.reasons.map(
		(id) =>
			USER_FEEDBACK_REASONS.find((reason) => reason.id === id)?.label ?? id,
	)
	const text = [
		"📝 Отзыв о приложении",
		`Оценка: ${feedback.rating}/5`,
		`ID группы: ${feedback.group ?? "Не указана"}`,
		`Платформа: ${feedback.platform}`,
		...(reasons.length ? [`Причины: ${reasons.join(", ")}`] : []),
		`Комментарий: ${feedback.comment.trim() || "Без комментария"}`,
	].join("\n")

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${env.botToken}/${env.botEnv === "test" ? "test/" : ""}sendMessage`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chat_id: env.telegramFeedbackChatId, text }),
				signal: AbortSignal.timeout(5000),
			},
		)
		const result = (await response.json()) as { ok?: boolean }
		if (!response.ok || !result.ok) {
			// biome-ignore lint/suspicious/noConsole: Report delivery failures without exposing the bot token.
			console.error("Failed to send feedback notification", response.status)
		}
	} catch {
		// biome-ignore lint/suspicious/noConsole: Report delivery failures without exposing the bot token.
		console.error("Failed to send feedback notification")
	}
}
