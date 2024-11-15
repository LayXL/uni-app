import { db } from "drizzle"
import { inArray } from "drizzle-orm"
import { groups } from "drizzle/schema.ts"

export const getLinkedGroups = (groupIds: number[]) =>
  db.select().from(groups).where(inArray(groups.id, groupIds))
