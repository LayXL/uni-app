import { db, inArray, subjectsTable } from "@repo/drizzle"

export const getLinkedSubjects = (subjectIds: number[]) =>
	db.select().from(subjectsTable).where(inArray(subjectsTable.id, subjectIds))
