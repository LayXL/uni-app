import { and, db, eq, groupsTable, ne } from "@repo/drizzle"
import { env } from "@repo/env"
import {
	TESTING_GROUP_ID,
	testingGroup,
	testingTeacherGroups,
} from "@repo/shared/testing-group"

import { publicProcedure } from "../../procedures/public"

const PRIORITY_GROUP_NAME = "Т-123"

const isPriorityGroup = (group: { displayName: string }) =>
	group.displayName.split(" (")[0] === PRIORITY_GROUP_NAME

const withPriorityGroupFirst = <T extends { displayName: string }>(
	groups: T[],
) =>
	groups.toSorted(
		(a, b) => Number(isPriorityGroup(b)) - Number(isPriorityGroup(a)),
	)

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

	const visibleGroups = env.testingGroupEnabled
		? [
				...groups.filter((group) => group.id !== TESTING_GROUP_ID),
				testingGroup,
				...testingTeacherGroups,
			]
		: groups

	return withPriorityGroupFirst(visibleGroups)
})
