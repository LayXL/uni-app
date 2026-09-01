import { and, arrayContains, classesTable, db, eq } from "@repo/drizzle"

import { populateLessons } from "./populate-lessons"

export const getDailyLessons = async (date: string, group: number) => {
	const dailyLessons = await db
		.select()
		.from(classesTable)
		.where(
			and(
				eq(classesTable.date, date),
				arrayContains(classesTable.groups, [group]),
			),
		)
		.orderBy(classesTable.date, classesTable.order)

	return populateLessons(dailyLessons, group)
}
