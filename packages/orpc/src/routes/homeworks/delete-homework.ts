import { ORPCError } from "@orpc/client"
import z from "zod"

import { and, db, eq, homeworksTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const deleteHomework = privateProcedure
	.input(z.object({ id: z.string() }))
	.handler(async ({ input, context }) => {
		const deleted = await db
			.delete(homeworksTable)
			.where(
				and(
					eq(homeworksTable.id, input.id),
					eq(homeworksTable.author, context.user.id),
				),
			)
			.returning()

		if (deleted.length === 0) {
			throw new ORPCError("NOT_FOUND", {
				message: "Домашнее задание не найдено",
			})
		}

		return { success: true }
	})
