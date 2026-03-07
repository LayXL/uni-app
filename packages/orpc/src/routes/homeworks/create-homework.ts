import { randomUUID } from "node:crypto"
import { ORPCError } from "@orpc/client"
import z from "zod"

import { db, eq, homeworksTable, subjectsTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

const homeworkFileSchema = z.object({
	key: z.string(),
	name: z.string(),
	size: z.number(),
	mimeType: z.string(),
	url: z.string(),
})

export const createHomework = privateProcedure
	.input(
		z.object({
			date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
			subject: z.number().optional(),
			deadline: z.string(),
			title: z.string().max(255),
			description: z.string(),
			files: homeworkFileSchema.array().default([]),
			isSharedWithWholeGroup: z.boolean().default(false),
		}),
	)
	.handler(async ({ input, context }) => {
		if (input.subject !== undefined) {
			const subject = await db
				.select()
				.from(subjectsTable)
				.where(eq(subjectsTable.id, input.subject))
				.limit(1)
				.then(([s]) => s)

			if (!subject) {
				throw new ORPCError("NOT_FOUND", { message: "Предмет не найден" })
			}
		}

		const id = randomUUID()

		const [homework] = await db
			.insert(homeworksTable)
			.values({
				id,
				date: input.date,
				subject: input.subject ?? null,
				deadline: new Date(input.deadline),
				author: context.user.id,
				group: context.user.group,
				title: input.title,
				description: input.description,
				files: input.files,
				isSharedWithWholeGroup: input.isSharedWithWholeGroup,
			})
			.returning()

		return homework
	})
