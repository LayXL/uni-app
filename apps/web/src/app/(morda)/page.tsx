import { HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { ScheduleHeader } from "@/features/schedule/ui/schedule-header"
import { ScheduleTimer } from "@/features/schedule/ui/schedule-timer"
import { Fetcher } from "@/shared/utils/fetcher"
import { isUnauthorizedError } from "@/shared/utils/is-unauthorized-error"
import { getServerTestNow } from "@/shared/utils/server-test-time"
import { SaveCurrentGroupAsUser } from "@/widgets/save-current-group-as-user"
import { ScheduleWithMapNavigation } from "@/widgets/schedule-with-map-navigation"

import { SettingsLink } from "./_ui/settings-button"

export default async function () {
	const fetcher = new Fetcher()

	const user = await fetcher.fetch(orpc.users.me).catch((error: unknown) => {
		if (isUnauthorizedError(error)) return null
		throw error
	})

	if (!user) return null

	if (user.group) {
		const dates = getNextTwoWeeksDates({ now: await getServerTestNow() })

		await Promise.all([
			fetcher.fetch(orpc.groups.getAllGroups),
			fetcher.fetch(orpc.schedule.getTimetable),
			fetcher.fetch(orpc.schedule.getSchedule, { dates, group: user.group.id }),
			fetcher.fetch(orpc.events.getEvents, { dates, group: user.group.id }),
		])
	} else {
		return redirect("/onboarding")
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<link
				rel="preload"
				href="/images/secretscode-channel-v2.webp"
				as="image"
				type="image/webp"
			/>
			<div className="flex min-h-screen flex-col pt-(--safe-area-inset-top) pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
				<ScheduleHeader action={<SettingsLink />} />
				<ScheduleTimer />
				<SaveCurrentGroupAsUser />
				<ScheduleWithMapNavigation />
			</div>
		</HydrationBoundary>
	)
}
