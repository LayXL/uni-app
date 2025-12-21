import { HydrationBoundary } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { Fetcher } from "@/shared/utils/fetcher"
import { ScheduleViewer } from "@/widgets/schedule-viewer"

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
			<ScheduleViewer />
		</HydrationBoundary>
	)
}
