import { inArray } from "drizzle-orm"

import { db, subjectsTable } from "@repo/drizzle"

export const getLinkedSubjects = (subjectIds: number[]) =>
	db.select().from(subjectsTable).where(inArray(subjectsTable.id, subjectIds))
