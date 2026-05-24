import { parseISO } from "date-fns"
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
import { env } from "@repo/env"
import { isTestingGroupId } from "@repo/shared/testing-group"

import { privateProcedure } from "../../procedures/private"

const getTestingEvents = ({
	dates,
	groupId,
}: {
	dates: string[]
	groupId: number | null | undefined
}) => {
	if (!env.testingGroupEnabled || !isTestingGroupId(groupId ?? undefined)) {
		return []
	}

	const date = dates[1] ?? dates[0]

	if (!date) {
		return []
	}

	const eventDate = parseISO(date)
	eventDate.setHours(14, 30, 0, 0)

	return [
		{
			id: -123,
			createdAt: new Date("2026-01-01T09:00:00.000Z"),
			author: {
				id: -1,
				firstName: "Отдел",
				lastName: "мероприятий",
			},
			title: "День моды в актовом зале",
			description:
				"Показ студенческих коллекций, встреча с дизайнерами и разбор портфолио",
			coverImage: null,
			backgroundColor: "#3F1D2B",
			borderColor: "#C26A8D",
			textColor: "#FFF7FA",
			buttonColor: "#FFD1DF",
			date: eventDate,
			buttonUrl: null,
			buttonText: null,
		},
	]
}

export const getEvents = privateProcedure
	.input(
		z.object({
			dates: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/)
				.array()
				.max(90),
			group: z.number().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const groupId = input.group ?? context.user.group

		let groupDisplayName: string | null = null

		if (groupId) {
			const group = await db
				.select({ displayName: groupsTable.displayName })
				.from(groupsTable)
				.where(eq(groupsTable.id, groupId))
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

		const events = await db
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
				backgroundColor: eventsTable.backgroundColor,
				borderColor: eventsTable.borderColor,
				textColor: eventsTable.textColor,
				buttonColor: eventsTable.buttonColor,
				date: eventsTable.date,
				buttonUrl: eventsTable.buttonUrl,
				buttonText: eventsTable.buttonText,
			})
			.from(eventsTable)
			.leftJoin(usersTable, eq(eventsTable.author, usersTable.id))
			.where(sql`${dateCondition} AND ${groupCondition}`)
			.orderBy(asc(eventsTable.date))

		return [
			...events,
			...getTestingEvents({ dates: input.dates, groupId }),
		].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	})
