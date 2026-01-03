import { format, parseISO, subDays } from "date-fns"
import z from "zod"

import {
	and,
	arrayContains,
	asc,
	classesTable,
	db,
	eq,
	getTableColumns,
	groupsTable,
	inArray,
	sql,
	subjectsTable,
} from "@repo/drizzle"
import { getConfig } from "@repo/shared/config/get-config"
import { lessonSchema } from "@repo/shared/lessons/types/lesson"

import { publicProcedure } from "../../procedures/public"

const addZeroToTime = (time: string) => {
	return time.padStart(5, "0")
}

const getScheduleFromDb = async (dates: string[], group: number) => {
	return db
		.select({
			...getTableColumns(classesTable),
			subject: {
				id: subjectsTable.id,
				name: subjectsTable.name,
			},
			groups: sql<
				{
					id: number
					displayName: string
					type: "studentsGroup" | "teacher"
				}[]
			>`(SELECT json_agg(json_build_object('id', ${groupsTable.id}, 'displayName', ${groupsTable.displayName}, 'type', ${groupsTable.type})) FROM ${groupsTable} WHERE ${groupsTable.id} = ANY(${classesTable.groups}))`,
		})
		.from(classesTable)
		.innerJoin(subjectsTable, eq(classesTable.subject, subjectsTable.id))
		.where(
			and(
				inArray(classesTable.date, dates),
				arrayContains(classesTable.groups, [group]),
			),
		)
		.orderBy(asc(classesTable.date), asc(classesTable.order))
}

export const getSchedule = publicProcedure
	.input(
		z.object({
			dates: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/)
				.array()
				.max(90),
			group: z.number(),
		}),
	)
	.output(lessonSchema.array())
	.handler(async ({ input }) => {
		const { dates, group } = input

		const timetable = await getConfig("timetable")

		const schedule = await getScheduleFromDb(dates, group)

		const daysWithoutClasses = dates.filter(
			(date) => !schedule.some((lesson) => lesson.date === date),
		)

		const predictedSchedules = await Promise.all(
			daysWithoutClasses.map(async (date) => {
				const parsedDate = parseISO(date)
				const predictedSchedule = await getScheduleFromDb(
					[format(subDays(parsedDate, 14), "yyyy-MM-dd")],
					group,
				)

				return predictedSchedule.map((lesson) => ({ ...lesson, date }))
			}),
		)

		schedule.push(...predictedSchedules.flat())

		return schedule.map((lesson) => {
			const weekday = new Date(lesson.date).getDay()

			const timetableItem = timetable.find((item) =>
				item.days.includes(weekday),
			)

			const timetableItemSchedule = timetableItem?.schedule.find(
				(item) => item.number === lesson.order,
			)

			return {
				...lesson,
				startTime: addZeroToTime(timetableItemSchedule?.time.start ?? ""),
				endTime: addZeroToTime(timetableItemSchedule?.time.end ?? ""),
			}
		})
	})
