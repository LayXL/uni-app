import { ORPCError } from "@orpc/client"
import z from "zod"

import { db, eq, groupsTable } from "@repo/drizzle"

import { publicProcedure } from "../../procedures/public"

export const getGroup = publicProcedure
	.input(
		z.object({
			id: z.number(),
		}),
	)
	.handler(async ({ input }) => {
		const group = await db
			.select()
			.from(groupsTable)
			.where(eq(groupsTable.id, input.id))
			.limit(1)
			.then(([group]) => group)

		if (!group) {
			throw new ORPCError("NOT_FOUND")
		}

		return group
	})
