import { ORPCError } from "@orpc/client"
import z from "zod"

import { and, db, eq, homeworksTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

const homeworkFileSchema = z.object({
	key: z.string(),
	name: z.string(),
	size: z.number(),
	mimeType: z.string(),
	url: z.string(),
})

export const updateHomework = privateProcedure
	.input(
		z.object({
			id: z.string(),
			date: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/)
				.optional(),
			subject: z.number().nullable().optional(),
			deadline: z.string().optional(),
			title: z.string().max(255).optional(),
			description: z.string().optional(),
			files: homeworkFileSchema.array().optional(),
			isSharedWithWholeGroup: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const existing = await db
			.select()
			.from(homeworksTable)
			.where(
				and(
					eq(homeworksTable.id, input.id),
					eq(homeworksTable.author, context.user.id),
				),
			)
			.limit(1)
			.then(([h]) => h)

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "Домашнее задание не найдено",
			})
		}

		const [updated] = await db
			.update(homeworksTable)
			.set({
				...(input.date !== undefined && { date: input.date }),
				...(input.subject !== undefined && { subject: input.subject }),
				...(input.deadline !== undefined && {
					deadline: new Date(input.deadline),
				}),
				...(input.title !== undefined && { title: input.title }),
				...(input.description !== undefined && {
					description: input.description,
				}),
				...(input.files !== undefined && { files: input.files }),
				...(input.isSharedWithWholeGroup !== undefined && {
					isSharedWithWholeGroup: input.isSharedWithWholeGroup,
				}),
			})
			.where(eq(homeworksTable.id, input.id))
			.returning()

		return updated
	})
