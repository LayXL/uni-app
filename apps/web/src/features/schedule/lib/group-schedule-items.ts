import type { Lesson } from "@repo/shared/lessons/types/lesson"

export const groupScheduleItems = (schedule: Lesson[], dates: string[]) => {
	const grouped = schedule.reduce(
		(acc, item) => {
			const date = item.date
			const lessons = acc.get(date) ?? []

			lessons.push(item)

			if (!acc.has(date)) {
				acc.set(date, lessons)
			}

			return acc
		},
		new Map<string, Lesson[]>(dates.map((date) => [date, []])),
	)

	return Array.from(grouped, ([date, lessons]) => ({
		date,
		lessons,
	}))
}
