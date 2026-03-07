import z from "zod"

import {
	asc,
	db,
	eq,
	eventsTable,
	groupsTable,
	sql,
	usersTable,
} from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const getEvents = privateProcedure
	.input(
		z.object({
			dates: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/)
				.array()
				.max(90),
		}),
	)
	.handler(async ({ input, context }) => {
		const userGroupId = context.user.group

		let groupDisplayName: string | null = null

		if (userGroupId) {
			const group = await db
				.select({ displayName: groupsTable.displayName })
				.from(groupsTable)
				.where(eq(groupsTable.id, userGroupId))
				.limit(1)
				.then(([g]) => g)

			groupDisplayName = group?.displayName ?? null
		}

		const dateCondition = sql`${eventsTable.date}::date IN (${sql.join(
			input.dates.map((d) => sql`${d}::date`),
			sql`, `,
		)})`

		const groupCondition = groupDisplayName
			? sql`(${eventsTable.groupsRegex} IS NULL OR ${groupDisplayName} ~ ${eventsTable.groupsRegex})`
			: sql`${eventsTable.groupsRegex} IS NULL`

		return db
			.select({
				id: eventsTable.id,
				createdAt: eventsTable.createdAt,
				author: {
					id: usersTable.id,
					firstName: usersTable.firstName,
					lastName: usersTable.lastName,
				},
				title: eventsTable.title,
				description: eventsTable.description,
				coverImage: eventsTable.coverImage,
				date: eventsTable.date,
				buttonUrl: eventsTable.buttonUrl,
				buttonText: eventsTable.buttonText,
			})
			.from(eventsTable)
			.leftJoin(usersTable, eq(eventsTable.author, usersTable.id))
			.where(sql`${dateCondition} AND ${groupCondition}`)
			.orderBy(asc(eventsTable.date))
	})
