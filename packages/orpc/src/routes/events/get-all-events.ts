import { ORPCError } from "@orpc/client"

import { asc, db, eq, eventsTable, usersTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const getAllEvents = privateProcedure.handler(async ({ context }) => {
	if (!context.user.isAdmin) {
		throw new ORPCError("FORBIDDEN")
	}

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
			backgroundColor: eventsTable.backgroundColor,
			borderColor: eventsTable.borderColor,
			textColor: eventsTable.textColor,
			groupsRegex: eventsTable.groupsRegex,
			date: eventsTable.date,
			buttonUrl: eventsTable.buttonUrl,
			buttonText: eventsTable.buttonText,
		})
		.from(eventsTable)
		.leftJoin(usersTable, eq(eventsTable.author, usersTable.id))
		.orderBy(asc(eventsTable.date))
})
