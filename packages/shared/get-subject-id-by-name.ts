import { db } from "drizzle"
import { subjects } from "drizzle/schema.ts"

export const getSubjectIdByName = async (name: string): Promise<number> => {
  const subject = await db.query.subjects.findFirst({
    where: (subject, { eq }) => eq(subject.name, name),
  })

  if (!subject) {
    const [newSubject] = await db
      .insert(subjects)
      .values({
        name,
      })
      .returning()

    return newSubject.id
  }

  return subject.id
}
