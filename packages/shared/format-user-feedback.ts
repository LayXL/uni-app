import { USER_FEEDBACK_REASONS } from "./user-feedback"

export const formatUserFeedback = (feedback: {
	userId: number
	rating: number
	reasons: string[]
	comment: string
	group: number | null
	platform: string
}) => {
	const reasons = feedback.reasons.map(
		(id) =>
			USER_FEEDBACK_REASONS.find((reason) => reason.id === id)?.label ?? id,
	)
	return [
		"📝 Отзыв о приложении",
		`ID пользователя: ${feedback.userId}`,
		`Оценка: ${feedback.rating}/5`,
		`ID группы: ${feedback.group ?? "Не указана"}`,
		`Платформа: ${feedback.platform}`,
		...(reasons.length ? [`Причины: ${reasons.join(", ")}`] : []),
		`Комментарий: ${feedback.comment.trim() || "Без комментария"}`,
	].join("\n")
}
