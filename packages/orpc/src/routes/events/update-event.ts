import { ORPCError } from "@orpc/client"
import z from "zod"

import { db, eq, eventsTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

const colorSchema = z
	.string()
	.regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Неверный формат цвета")
	.nullable()
	.optional()

export const updateEvent = privateProcedure
	.input(
		z.object({
			id: z.number(),
			title: z.string().max(255).optional(),
			description: z.string().nullable().optional(),
			coverImage: z.string().nullable().optional(),
			backgroundColor: colorSchema,
			borderColor: colorSchema,
			textColor: colorSchema,
			buttonColor: colorSchema,
			groupsRegex: z.string().nullable().optional(),
			date: z.iso.datetime().optional(),
			buttonUrl: z.string().nullable().optional(),
			buttonText: z.string().max(255).nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		if (!context.user.isAdmin) {
			throw new ORPCError("FORBIDDEN")
		}

		const existing = await db
			.select()
			.from(eventsTable)
			.where(eq(eventsTable.id, input.id))
			.limit(1)
			.then(([e]) => e)

		if (!existing) {
			throw new ORPCError("NOT_FOUND", {
				message: "Событие не найдено",
			})
		}

		const [updated] = await db
			.update(eventsTable)
			.set({
				...(input.title !== undefined && { title: input.title }),
				...(input.description !== undefined && {
					description: input.description,
				}),
				...(input.coverImage !== undefined && {
					coverImage: input.coverImage,
				}),
				...(input.backgroundColor !== undefined && {
					backgroundColor: input.backgroundColor,
				}),
				...(input.borderColor !== undefined && {
					borderColor: input.borderColor,
				}),
				...(input.textColor !== undefined && {
					textColor: input.textColor,
				}),
				...(input.buttonColor !== undefined && {
					buttonColor: input.buttonColor,
				}),
				...(input.groupsRegex !== undefined && {
					groupsRegex: input.groupsRegex,
				}),
				...(input.date !== undefined && { date: new Date(input.date) }),
				...(input.buttonUrl !== undefined && {
					buttonUrl: input.buttonUrl,
				}),
				...(input.buttonText !== undefined && {
					buttonText: input.buttonText,
				}),
			})
			.where(eq(eventsTable.id, input.id))
			.returning()

		return updated
	})
