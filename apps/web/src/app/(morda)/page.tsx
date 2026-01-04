import { HydrationBoundary } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { MapViewerHome } from "@/app/(morda)/_ui/map-viewer-home"
import { MapViewer } from "@/features/map/ui/map-viewer"
import { ScheduleHeader } from "@/features/schedule/ui/schedule-header"
import { ScheduleViewer } from "@/features/schedule/ui/schedule-viewer"
import { Fetcher } from "@/shared/utils/fetcher"

import { RouteNavigation } from "../../features/map/ui/route-navigation"
import { ScheduleViewerHome } from "./_ui/schedule-viewer-home"

export default async function () {
	const fetcher = new Fetcher()

	const user = await fetcher.fetch(orpc.users.me)

	await fetcher.fetch(orpc.map.getMap)

	if (user.group) {
		await fetcher.fetch(orpc.schedule.getSchedule, {
			dates: getNextTwoWeeksDates(),
			group: user.group.id,
		})
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<div className="flex flex-col">
				<MapViewerHome>
					<MapViewer />
				</MapViewerHome>
				<ScheduleViewerHome>
					<div className="-mt-4 flex flex-col bg-background rounded-t-2xl">
						<ScheduleHeader />
						<ScheduleViewer />
					</div>
				</ScheduleViewerHome>
			</div>
			<RouteNavigation />
		</HydrationBoundary>
	)
}
