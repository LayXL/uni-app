import { formatISO } from "date-fns/formatISO"
import { and, arrayContains, gte } from "drizzle-orm"

import { classesTable, db } from "@repo/drizzle"

import { populateLessons } from "./populate-lessons"

export const getUpcomingLessons = async (group: number) => {
	const upcomingLessons = await db
		.select()
		.from(classesTable)
		.where(
			and(
				gte(
					classesTable.date,
					formatISO(new Date(), { representation: "date" }),
				),
				arrayContains(classesTable.groups, [group]),
			),
		)
		.orderBy(classesTable.date, classesTable.order)

	return populateLessons(upcomingLessons, group)
}
