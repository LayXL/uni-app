import { ORPCError } from "@orpc/client"
import z from "zod"

import {
	and,
	db,
	eq,
	homeworkCompletionsTable,
	homeworksTable,
	or,
	sql,
	subjectsTable,
	usersTable,
} from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const getHomework = privateProcedure
	.input(z.object({ id: z.string() }))
	.handler(async ({ input, context }) => {
		const userId = context.user.id
		const userGroup = context.user.group

		const isAuthor = eq(homeworksTable.author, userId)
		const isSharedWithGroup = userGroup
			? and(
					eq(homeworksTable.group, userGroup),
					eq(homeworksTable.isSharedWithWholeGroup, true),
				)
			: undefined

		const accessCondition = isSharedWithGroup
			? or(isAuthor, isSharedWithGroup)
			: isAuthor

		const homework = await db
			.select({
				id: homeworksTable.id,
				date: homeworksTable.date,
				subject: { id: subjectsTable.id, name: subjectsTable.name },
				createdAt: homeworksTable.createdAt,
				deadline: homeworksTable.deadline,
				author: homeworksTable.author,
				authorFirstName: usersTable.firstName,
				authorLastName: usersTable.lastName,
				group: homeworksTable.group,
				title: homeworksTable.title,
				description: homeworksTable.description,
				files: homeworksTable.files,
				isSharedWithWholeGroup: homeworksTable.isSharedWithWholeGroup,
				isCompleted: sql<boolean>`${homeworkCompletionsTable.userId} IS NOT NULL`,
			})
			.from(homeworksTable)
			.leftJoin(subjectsTable, eq(homeworksTable.subject, subjectsTable.id))
			.leftJoin(usersTable, eq(homeworksTable.author, usersTable.id))
			.leftJoin(
				homeworkCompletionsTable,
				and(
					eq(homeworkCompletionsTable.homeworkId, homeworksTable.id),
					eq(homeworkCompletionsTable.userId, userId),
				),
			)
			.where(and(eq(homeworksTable.id, input.id), accessCondition))
			.limit(1)
			.then(([h]) => h)

		if (!homework) {
			throw new ORPCError("NOT_FOUND")
		}

		return homework
	})
