import { db, eq, userScheduleCardSettingsTable } from "@repo/drizzle"
import { cardSettingsSchema } from "@repo/shared/lessons/card-settings"

import { privateProcedure } from "../../procedures/private"

export const getCardSettings = privateProcedure
	.output(cardSettingsSchema)
	.handler(async ({ context }) => {
		const userId = context.user.id
		await db
			.insert(userScheduleCardSettingsTable)
			.values({ userId })
			.onConflictDoNothing()

		const [settings] = await db
			.select()
			.from(userScheduleCardSettingsTable)
			.where(eq(userScheduleCardSettingsTable.userId, userId))

		return cardSettingsSchema.parse(settings)
	})

export const updateCardSettings = privateProcedure
	.input(cardSettingsSchema.partial().strict())
	.output(cardSettingsSchema)
	.handler(async ({ context, input }) => {
		const userId = context.user.id
		const [settings] = await db
			.insert(userScheduleCardSettingsTable)
			.values({ userId, ...input })
			.onConflictDoUpdate({
				target: userScheduleCardSettingsTable.userId,
				set: { userId, ...input },
			})
			.returning()

		return cardSettingsSchema.parse(settings)
	})
