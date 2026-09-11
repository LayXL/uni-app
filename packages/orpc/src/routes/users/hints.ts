import { ORPCError } from "@orpc/server"

import { db, eq, userScheduleCardSettingsTable } from "@repo/drizzle"
import { shouldShowScheduleSettingsHint } from "@repo/shared/lessons/schedule-settings-hint"

import { privateProcedure } from "../../procedures/private"

export const getHints = privateProcedure.handler(async ({ context }) => {
	const [settings] = await db
		.select()
		.from(userScheduleCardSettingsTable)
		.where(eq(userScheduleCardSettingsTable.userId, context.user.id))
	return {
		showScheduleSettings: shouldShowScheduleSettingsHint({
			visitCount: context.user.appOpenCount,
			dismissed: settings?.scheduleSettingsHintDismissed ?? false,
			forced: settings?.scheduleSettingsHintForced ?? false,
		}),
	}
})

export const dismissScheduleSettingsHint = privateProcedure.handler(
	async ({ context }) => {
		const values = {
			scheduleSettingsHintDismissed: true,
			scheduleSettingsHintForced: false,
		}
		await db
			.insert(userScheduleCardSettingsTable)
			.values({ userId: context.user.id, ...values })
			.onConflictDoUpdate({
				target: userScheduleCardSettingsTable.userId,
				set: values,
			})
		return { showScheduleSettings: false }
	},
)

export const resetHints = privateProcedure.handler(async ({ context }) => {
	if (!context.user.isAdmin) throw new ORPCError("FORBIDDEN")
	const values = {
		scheduleSettingsHintDismissed: false,
		scheduleSettingsHintForced: true,
	}
	await db
		.insert(userScheduleCardSettingsTable)
		.values({ userId: context.user.id, ...values })
		.onConflictDoUpdate({
			target: userScheduleCardSettingsTable.userId,
			set: values,
		})
	return { showScheduleSettings: true }
})
