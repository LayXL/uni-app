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

import { publicProcedure } from "../../procedures/public"

export const getSchedule = publicProcedure
	.input(
		z.object({
			date: z
				.date()
				.transform(
					(date) =>
						`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
				)
				.array(),
			group: z.number(),
		}),
	)
	.handler(async ({ input }) => {
		const { date, group } = input

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
					inArray(classesTable.date, date),
					arrayContains(classesTable.groups, [group]),
				),
			)
			.orderBy(asc(classesTable.order))

		return schedule
	})
