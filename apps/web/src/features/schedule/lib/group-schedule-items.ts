import type { Lesson } from "@repo/shared/lessons/types/lesson"

export const groupScheduleItems = (schedule: Lesson[]) => {
	const grouped = schedule.reduce((acc, item) => {
		const date = item.date
		const lessons = acc.get(date) ?? []

		lessons.push(item)

		if (!acc.has(date)) {
			acc.set(date, lessons)
		}

		return acc
	}, new Map<string, Lesson[]>())

	return Array.from(grouped, ([date, lessons]) => ({
		date,
		lessons,
	}))
}
