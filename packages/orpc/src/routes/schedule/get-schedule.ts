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
import { lessonSchema } from "@repo/shared/lessons/types/lesson"

import { publicProcedure } from "../../procedures/public"

export const getSchedule = publicProcedure
	.input(
		z.object({
			dates: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/)
				.array(),
			group: z.number(),
		}),
	)
	.output(lessonSchema.array())
	.handler(async ({ input }) => {
		const { dates, group } = input

		const schedule = await db
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
				>`(SELECT json_agg(json_build_object('id', ${groupsTable.id}, 'displayName', ${groupsTable.displayName}, 'type', ${groupsTable.type})) FROM ${groupsTable} WHERE ${groupsTable.id} = ANY(${classesTable.groups}))`.mapWith(
					(val) =>
						val as {
							id: number
							displayName: string
							type: "studentsGroup" | "teacher"
						}[],
				),
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

		return schedule
	})
