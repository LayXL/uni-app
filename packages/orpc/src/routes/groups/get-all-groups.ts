import { db, eq, groupsTable } from "@repo/drizzle"

import { publicProcedure } from "../../procedures/public"

export const getAllGroups = publicProcedure.handler(async () => {
	const groups = await db
		.select()
		.from(groupsTable)
		.where(eq(groupsTable.isDeleted, false))

	return groups
})
