import z from "zod"

import { and, db, eq, homeworkCompletionsTable } from "@repo/drizzle"

import { privateProcedure } from "../../procedures/private"

export const toggleCompletion = privateProcedure
	.input(
		z.object({
			homeworkId: z.string(),
			completed: z.boolean(),
		}),
	)
	.handler(async ({ input, context }) => {
		const userId = context.user.id

		if (input.completed) {
			await db
				.insert(homeworkCompletionsTable)
				.values({ userId, homeworkId: input.homeworkId })
				.onConflictDoNothing()
		} else {
			await db
				.delete(homeworkCompletionsTable)
				.where(
					and(
						eq(homeworkCompletionsTable.userId, userId),
						eq(homeworkCompletionsTable.homeworkId, input.homeworkId),
					),
				)
		}

		return { completed: input.completed }
	})
