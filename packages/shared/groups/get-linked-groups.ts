import { db, groupsTable, inArray } from "@repo/drizzle"

export const getLinkedGroups = (groupIds: number[]) =>
	db.select().from(groupsTable).where(inArray(groupsTable.id, groupIds))
