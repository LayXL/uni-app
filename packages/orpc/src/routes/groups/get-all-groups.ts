import { and, db, eq, groupsTable, ne } from "@repo/drizzle"
import { env } from "@repo/env"
import {
	TESTING_GROUP_ID,
	testingGroup,
	testingTeacherGroups,
} from "@repo/shared/testing-group"

import { publicProcedure } from "../../procedures/public"

export const getAllGroups = publicProcedure.handler(async () => {
	const groups = await db
		.select()
		.from(groupsTable)
		.where(
			env.testingGroupEnabled
				? eq(groupsTable.isDeleted, false)
				: and(
						eq(groupsTable.isDeleted, false),
						ne(groupsTable.id, TESTING_GROUP_ID),
					),
		)

	return env.testingGroupEnabled
		? [
				...groups.filter((group) => group.id !== TESTING_GROUP_ID),
				testingGroup,
				...testingTeacherGroups,
			]
		: groups
})
