import { db, eq, groupsTable } from "@repo/drizzle"
import { env } from "@repo/env"
import { isTestingGroupId } from "@repo/shared/testing-group"

import { privateProcedure } from "../../procedures/private"

export const me = privateProcedure.handler(async ({ context }) => {
	const group = context.user.group
		? await db
				.select()
				.from(groupsTable)
				.where(eq(groupsTable.id, context.user.group))
				.limit(1)
				.then(([group]) => group)
		: null
	const visibleGroup =
		group && (!isTestingGroupId(group.id) || env.testingGroupEnabled)
			? group
			: null

	return {
		id: context.user.id,
		telegramId: context.user.telegramId,
		isAdmin: context.user.isAdmin ? true : undefined,
		group: visibleGroup,
	}
})
