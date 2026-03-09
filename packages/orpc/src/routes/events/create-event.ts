import { ORPCError } from "@orpc/client"
import z from "zod"

import { db, eventsTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

const colorSchema = z
	.string()
	.regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Неверный формат цвета")
	.nullable()
	.optional()

export const createEvent = privateProcedure
	.input(
		z.object({
			title: z.string().max(255),
			description: z.string().nullable().optional(),
			coverImage: z.string().nullable().optional(),
			backgroundColor: colorSchema,
			borderColor: colorSchema,
			textColor: colorSchema,
			buttonColor: colorSchema,
			groupsRegex: z.string().nullable().optional(),
			date: z.iso.datetime(),
			buttonUrl: z.string().nullable().optional(),
			buttonText: z.string().max(255).nullable().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		if (!context.user.isAdmin) {
			throw new ORPCError("FORBIDDEN")
		}

		const [event] = await db
			.insert(eventsTable)
			.values({
				author: context.user.id,
				title: input.title,
				description: input.description ?? null,
				coverImage: input.coverImage ?? null,
				backgroundColor: input.backgroundColor ?? null,
				borderColor: input.borderColor ?? null,
				textColor: input.textColor ?? null,
				buttonColor: input.buttonColor ?? null,
				groupsRegex: input.groupsRegex ?? null,
				date: new Date(input.date),
				buttonUrl: input.buttonUrl ?? null,
				buttonText: input.buttonText ?? null,
			})
			.returning()

		return event
	})
