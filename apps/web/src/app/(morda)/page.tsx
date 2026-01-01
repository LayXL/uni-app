import { HydrationBoundary } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { Fetcher } from "@/shared/utils/fetcher"
import { ScheduleHeader } from "@/features/schedule/ui/schedule-header"
import { ScheduleViewer } from "@/features/schedule/ui/schedule-viewer"

export default async function () {
	const fetcher = new Fetcher()

	const user = await fetcher.fetch(orpc.users.me, undefined)

	if (user.group) {
		await fetcher.fetch(orpc.schedule.getSchedule, {
			dates: getNextTwoWeeksDates(),
			group: user.group.id,
		})
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<ScheduleHeader />
			<ScheduleViewer />
		</HydrationBoundary>
	)
}
