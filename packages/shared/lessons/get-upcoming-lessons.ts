import { formatISO } from "date-fns/formatISO"

import { and, arrayContains, classesTable, db, gte } from "@repo/drizzle"

import { getTestNow } from "../time/test-time"
import { populateLessons } from "./populate-lessons"

export const getUpcomingLessons = async (group: number, now = getTestNow()) => {
	const upcomingLessons = await db
		.select()
		.from(classesTable)
		.where(
			and(
				gte(classesTable.date, formatISO(now, { representation: "date" })),
				arrayContains(classesTable.groups, [group]),
			),
		)
		.orderBy(classesTable.date, classesTable.order)

	return populateLessons(upcomingLessons, group)
}
