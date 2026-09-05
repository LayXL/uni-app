import z from "zod"

import {
	and,
	asc,
	classesTable,
	db,
	desc,
	eq,
	groupsTable,
	gt,
	inArray,
	isNotNull,
	lt,
	lte,
	or,
	sql,
} from "@repo/drizzle"
import { getConfig } from "@repo/shared/config/get-config"
import { getClassroomNamesForRoom } from "@repo/shared/lessons/normalize-classroom-name"
import type { Timetable } from "@repo/shared/timetable"

import { getContextTestNow } from "../../lib/test-time"
import { publicProcedure } from "../../procedures/public"

const teacherSchema = z.object({ id: z.number(), displayName: z.string() })
const clock = new Intl.DateTimeFormat("en", {
	timeZone: "Asia/Yekaterinburg",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	hourCycle: "h23",
})

const getLessonTime = (timetable: Timetable, boundary: "start" | "end") => {
	const cases = timetable.flatMap(({ days, schedule }) =>
		schedule.flatMap(({ number, time }) =>
			days.map(
				(day) => sql`when extract(dow from ${classesTable.date}) = ${day}
					and ${classesTable.order} = ${number} then ${time[boundary].padStart(5, "0")}`,
			),
		),
	)
	return cases.length
		? sql<string>`case ${sql.join(cases, sql` `)} end`
		: sql<string>`null`
}

export const getRoomTeachers = publicProcedure
	.input(z.object({ roomId: z.number().int() }))
	.output(
		z.object({
			previous: z.array(teacherSchema),
			current: z.array(teacherSchema),
		}),
	)
	.handler(async ({ input, context }) => {
		const [buildingScheme, timetable] = await Promise.all([
			getConfig("buildingScheme"),
			getConfig("timetable"),
		])
		const classrooms = getClassroomNamesForRoom(
			buildingScheme.entities,
			input.roomId,
		)
		if (!classrooms.length) return { previous: [], current: [] }

		const now = getContextTestNow(context)
		const parts = Object.fromEntries(
			clock.formatToParts(now).map(({ type, value }) => [type, value]),
		)
		const date = `${parts.year}-${parts.month}-${parts.day}`
		const time = `${parts.hour}:${parts.minute}`

		// Only saved, in-person lessons: never use the schedule's fortnight fallback.
		const lessons = db
			.select({
				date: classesTable.date,
				groups: classesTable.groups,
				startTime: getLessonTime(timetable, "start").as("start_time"),
				endTime: getLessonTime(timetable, "end").as("end_time"),
			})
			.from(classesTable)
			.where(
				and(
					inArray(classesTable.classroom, classrooms),
					eq(classesTable.isCancelled, false),
					eq(classesTable.isDistance, false),
					lte(classesTable.date, date),
				),
			)
			.as("room_lessons")

		const lastCompleted = db
			.select({
				date: lessons.date,
				endTime: sql<string>`${lessons.endTime}`.as("last_end_time"),
			})
			.from(lessons)
			.where(
				and(
					isNotNull(lessons.endTime),
					or(lt(lessons.date, date), lte(lessons.endTime, time)),
				),
			)
			.orderBy(desc(lessons.date), desc(lessons.endTime))
			.limit(1)
			.as("last_completed")

		const [previousLessons, currentLessons] = await Promise.all([
			db
				.select({ groups: lessons.groups })
				.from(lessons)
				.innerJoin(
					lastCompleted,
					and(
						eq(lessons.date, lastCompleted.date),
						eq(lessons.endTime, lastCompleted.endTime),
					),
				),
			db
				.select({ groups: lessons.groups })
				.from(lessons)
				.where(
					and(
						eq(lessons.date, date),
						lte(lessons.startTime, time),
						gt(lessons.endTime, time),
					),
				),
		])

		const previousIds = new Set(previousLessons.flatMap(({ groups }) => groups))
		const currentIds = new Set(currentLessons.flatMap(({ groups }) => groups))
		const groupIds = [...new Set([...previousIds, ...currentIds])]
		if (!groupIds.length) return { previous: [], current: [] }

		const teachers = await db
			.select({ id: groupsTable.id, displayName: groupsTable.displayName })
			.from(groupsTable)
			.where(
				and(inArray(groupsTable.id, groupIds), eq(groupsTable.type, "teacher")),
			)
			.orderBy(asc(groupsTable.displayName))

		return {
			previous: teachers.filter(({ id }) => previousIds.has(id)),
			current: teachers.filter(({ id }) => currentIds.has(id)),
		}
	})
