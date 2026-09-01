import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { getScheduleChangeMessages } from "../lib/get-schedule-change-messages"

type ScheduleDayChangesProps = {
	lessons: Lesson[]
}

export const ScheduleDayChanges = ({ lessons }: ScheduleDayChangesProps) => {
	const messages = getScheduleChangeMessages(lessons)

	if (messages.length === 0) return null

	return (
		<section
			className="flex flex-col gap-1 px-2 text-sm text-muted"
			aria-label="Изменения в расписании"
		>
			{messages.map((message, index) => (
				<p key={`${index}-${message}`}>{message}</p>
			))}
		</section>
	)
}
