import {
	and,
	asc,
	db,
	eq,
	gte,
	homeworkCompletionsTable,
	homeworksTable,
	or,
	sql,
	subjectsTable,
} from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const getHomeworks = privateProcedure.handler(async ({ context }) => {
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

	return db
		.select({
			id: homeworksTable.id,
			date: homeworksTable.date,
			subject: { id: subjectsTable.id, name: subjectsTable.name },
			createdAt: homeworksTable.createdAt,
			deadline: homeworksTable.deadline,
			author: homeworksTable.author,
			group: homeworksTable.group,
			title: homeworksTable.title,
			description: homeworksTable.description,
			files: homeworksTable.files,
			isSharedWithWholeGroup: homeworksTable.isSharedWithWholeGroup,
			isCompleted: sql<boolean>`${homeworkCompletionsTable.userId} IS NOT NULL`,
		})
		.from(homeworksTable)
		.leftJoin(subjectsTable, eq(homeworksTable.subject, subjectsTable.id))
		.leftJoin(
			homeworkCompletionsTable,
			and(
				eq(homeworkCompletionsTable.homeworkId, homeworksTable.id),
				eq(homeworkCompletionsTable.userId, userId),
			),
		)
		.where(and(gte(homeworksTable.deadline, sql`now()`), accessCondition))
		.orderBy(asc(homeworksTable.deadline))
})
