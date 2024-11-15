import { db } from "drizzle"
import { inArray } from "drizzle-orm"
import { subjects } from "drizzle/schema.ts"

export const getLinkedSubjects = (subjectIds: number[]) =>
  db.select().from(subjects).where(inArray(subjects.id, subjectIds))
