import { db, subjectsTable } from "@repo/drizzle"

export const getSubjectIdByName = async (name: string): Promise<number> => {
	const subject = await db.query.subjectsTable.findFirst({
		where: (subject, { eq }) => eq(subject.name, name),
	})

	if (!subject) {
		const [newSubject] = await db
			.insert(subjectsTable)
			.values({
				name,
			})
			.returning()

		return newSubject.id
	}

	return subject.id
}
