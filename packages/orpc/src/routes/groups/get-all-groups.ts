import { db, eq, groupsTable } from "@repo/drizzle"
import { env } from "@repo/env"
import { testingGroup, testingTeacherGroups } from "@repo/shared/testing-group"

import { publicProcedure } from "../../procedures/public"

export const getAllGroups = publicProcedure.handler(async () => {
	const groups = await db
		.select()
		.from(groupsTable)
		.where(eq(groupsTable.isDeleted, false))

	return env.testingGroupEnabled
		? [...groups, testingGroup, ...testingTeacherGroups]
		: groups
})
