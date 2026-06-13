import { format, isAfter, isEqual, parse } from "date-fns"

import type { Lesson } from "@repo/shared/lessons/types/lesson"

export const isLessonActive = (lesson: Lesson, now: Date) => {
	if (lesson.isCancelled || lesson.date !== format(now, "yyyy-MM-dd")) {
		return false
	}

	const start = parse(
		`${lesson.date}T${lesson.startTime}`,
		"yyyy-MM-dd'T'HH:mm",
		now,
	)
	const end = parse(
		`${lesson.date}T${lesson.endTime}`,
		"yyyy-MM-dd'T'HH:mm",
		now,
	)

	return (isAfter(now, start) || isEqual(now, start)) && isAfter(end, now)
}
