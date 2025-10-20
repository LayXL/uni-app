import { and, arrayContains, eq } from "drizzle-orm"

import { classesTable, db } from "@repo/drizzle"

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
