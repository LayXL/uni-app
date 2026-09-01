export const USER_FEEDBACK_REASONS = [
	{ id: "slow_loading", label: "Долго грузит" },
	{ id: "map_issues", label: "Проблемы с картой" },
	{ id: "incorrect_schedule", label: "Не то расписание" },
	{ id: "confusing_interface", label: "Неудобный интерфейс" },
	{ id: "crashes_or_freezes", label: "Зависает" },
	{ id: "missing_features", label: "Мало функций" },
] as const

export const USER_FEEDBACK_REASON_IDS = USER_FEEDBACK_REASONS.map(
	(reason) => reason.id,
) as [UserFeedbackReason, ...UserFeedbackReason[]]

export type UserFeedbackReason = (typeof USER_FEEDBACK_REASONS)[number]["id"]

export const shouldShowUserFeedbackPrompt = ({
	visitCount,
}: {
	visitCount: number
}) => visitCount === 2

export const normalizeUserFeedbackReasons = (
	rating: number,
	reasons: UserFeedbackReason[],
) => (rating <= 3 ? reasons : [])
