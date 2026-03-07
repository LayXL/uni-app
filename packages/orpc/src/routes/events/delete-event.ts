import { ORPCError } from "@orpc/client"
import z from "zod"

import { db, eq, eventsTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const deleteEvent = privateProcedure
	.input(z.object({ id: z.number() }))
	.handler(async ({ input, context }) => {
		if (!context.user.isAdmin) {
			throw new ORPCError("FORBIDDEN")
		}

		const deleted = await db
			.delete(eventsTable)
			.where(eq(eventsTable.id, input.id))
			.returning()

		if (deleted.length === 0) {
			throw new ORPCError("NOT_FOUND", {
				message: "Событие не найдено",
			})
		}

		return { success: true }
	})
