import { ORPCError } from "@orpc/client"
import { z } from "zod"

import { db, sql, userFeedbackTable } from "@repo/drizzle"
import { USER_FEEDBACK_REASON_IDS } from "@repo/shared/user-feedback"

import { privateProcedure } from "../../procedures/private"

const inputSchema = z
	.object({
		rating: z.number().int().min(1).max(5),
		reasons: z.enum(USER_FEEDBACK_REASON_IDS).array().max(6),
		comment: z.string().max(1000).default(""),
		sessionId: z.string().min(16).max(64),
	})
	.superRefine(({ rating, reasons }, context) => {
		if (new Set(reasons).size !== reasons.length) {
			context.addIssue({
				code: "custom",
				message: "Причины не должны повторяться",
				path: ["reasons"],
			})
		}

		if (rating > 3 && reasons.length > 0) {
			context.addIssue({
				code: "custom",
				message: "Причины можно указать только для оценки 3 или ниже",
				path: ["reasons"],
			})
		}
	})

export const submitFeedback = privateProcedure
	.input(inputSchema)
	.handler(async ({ context, input }) => {
		if (context.user.lastAppOpenSessionId !== input.sessionId) {
			throw new ORPCError("FORBIDDEN")
		}

		const platform = context.user.telegramId !== null ? "telegram" : "vk"
		const [feedback] = await db
			.insert(userFeedbackTable)
			.values({
				userId: context.user.id,
				rating: input.rating,
				reasons: input.reasons,
				comment: input.comment,
				group: context.user.group,
				platform,
				visitNumber: context.user.appOpenCount,
				sessionId: input.sessionId,
			})
			.onConflictDoUpdate({
				target: userFeedbackTable.userId,
				set: {
					rating: input.rating,
					reasons: input.reasons,
					comment: input.comment,
					group: context.user.group,
					platform,
					visitNumber: context.user.appOpenCount,
					sessionId: input.sessionId,
					updatedAt: sql`now()`,
				},
			})
			.returning()

		if (!feedback) {
			throw new ORPCError("INTERNAL_SERVER_ERROR")
		}

		return feedback
	})
