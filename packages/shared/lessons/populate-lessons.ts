import type { classesTable } from "@repo/drizzle"

import { getLinkedGroups } from "../groups/get-linked-groups"
import { getLinkedSubjects } from "../subjects/get-linked-subjects"

export const populateLessons = async (
	items: (typeof classesTable.$inferSelect)[],
	groupToExclude?: number,
) => {
	const linkedGroups = await getLinkedGroups(
		items.flatMap((item) => item.groups),
	)

	const linkedSubjects = await getLinkedSubjects(
		items.map((item) => item.subject),
	)

	return items.map((item) => ({
		...item,
		subject: linkedSubjects.find(({ id }) => id === item.subject)?.name ?? "",
		groups: item.groups
			.map((id) => linkedGroups.find((group) => group.id === id))
			.filter((x) => x?.id !== groupToExclude)
			.filter((x) => x !== undefined),
	}))
}
