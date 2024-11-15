import type { classes } from "drizzle/schema.ts"
import { getLinkedGroups } from "../groups/get-linked-groups.ts"
import { getLinkedSubjects } from "../subjects/get-linked-subjects.ts"

export const populateLessons = async (
  items: (typeof classes.$inferSelect)[],
  groupToExclude?: number
) => {
  const linkedGroups = await getLinkedGroups(
    items.flatMap((item) => item.groups)
  )

  const linkedSubjects = await getLinkedSubjects(
    items.map((item) => item.subject)
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
