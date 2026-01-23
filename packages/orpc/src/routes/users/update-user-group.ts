import { ORPCError } from "@orpc/client"
import { z } from "zod"

import { db, eq, groupsTable, usersTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const updateUserGroup = privateProcedure
	.input(
		z.object({
			groupId: z.number().nullable(),
		}),
	)
	.handler(async ({ context, input }) => {
		if (input.groupId) {
			const group = await db.query.groupsTable.findFirst({
				where: eq(groupsTable.id, input.groupId),
			})

			if (!group) {
				throw new ORPCError("NOT_FOUND", {
					message: "Group not found",
				})
			}
		}

		await db
			.update(usersTable)
			.set({ group: input.groupId })
			.where(eq(usersTable.id, context.user.id))

		return {
			success: true,
		}
	})
