import { inArray } from "drizzle-orm"

import { db, groupsTable } from "@repo/drizzle"

export const getLinkedGroups = (groupIds: number[]) =>
	db.select().from(groupsTable).where(inArray(groupsTable.id, groupIds))
