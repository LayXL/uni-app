import { z } from "zod"

import { db, eq, usersTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const updateNotifications = privateProcedure
	.input(z.object({ enabled: z.boolean() }))
	.handler(async ({ context, input }) => {
		await db
			.update(usersTable)
			.set({ isEnabledNotifications: input.enabled })
			.where(eq(usersTable.id, context.user.id))

		return { isEnabledNotifications: input.enabled }
	})
