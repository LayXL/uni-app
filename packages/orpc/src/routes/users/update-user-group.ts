import { z } from "zod"

import { db, eq, usersTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const updateUserGroup = privateProcedure
	.input(
		z.object({
			groupId: z.number(),
		}),
	)
	.handler(async ({ context, input }) => {
		await db
			.update(usersTable)
			.set({ group: input.groupId })
			.where(eq(usersTable.id, context.user.id))

		return {
			success: true,
		}
	})
