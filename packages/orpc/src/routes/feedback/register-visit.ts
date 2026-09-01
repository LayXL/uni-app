import { z } from "zod"

import { and, db, eq, isNull, ne, or, sql, usersTable } from "@repo/drizzle"
import { shouldShowUserFeedbackPrompt } from "@repo/shared/user-feedback"

import { privateProcedure } from "../../procedures/private"

export const registerVisit = privateProcedure
	.input(
		z.object({
			sessionId: z.string().min(16).max(64),
		}),
	)
	.handler(async ({ context, input }) => {
		const [updatedUser] = await db
			.update(usersTable)
			.set({
				appOpenCount: sql`${usersTable.appOpenCount} + 1`,
				lastAppOpenSessionId: input.sessionId,
				lastAppOpenedAt: sql`now()`,
			})
			.where(
				and(
					eq(usersTable.id, context.user.id),
					or(
						isNull(usersTable.lastAppOpenSessionId),
						ne(usersTable.lastAppOpenSessionId, input.sessionId),
					),
				),
			)
			.returning({ appOpenCount: usersTable.appOpenCount })

		const currentUser = updatedUser
			? Promise.resolve(updatedUser)
			: db
					.select({ appOpenCount: usersTable.appOpenCount })
					.from(usersTable)
					.where(eq(usersTable.id, context.user.id))
					.limit(1)
					.then(([user]) => user)

		const visitCount = (await currentUser)?.appOpenCount ?? 0

		return {
			visitCount,
			shouldShow: shouldShowUserFeedbackPrompt({
				visitCount,
			}),
		}
	})
