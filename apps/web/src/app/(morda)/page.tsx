import { HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { MapViewerHome } from "@/app/(morda)/_ui/map-viewer-home"
import { MapBottomBar } from "@/features/map/ui/map-bottom-bar"
import { MapViewer3D } from "@/features/map/ui/map-viewer-3d"
import { ScheduleHeader } from "@/features/schedule/ui/schedule-header"
import { ScheduleViewer } from "@/features/schedule/ui/schedule-viewer"
import { Fetcher } from "@/shared/utils/fetcher"
import { SaveCurrentGroupAsUser } from "@/widgets/save-current-group-as-user"

import { RouteNavigation } from "../../features/map/ui/route-navigation"
import { DebugResetUserGroupButton } from "./_ui/debug-reset-user-group-button"
import { MapBottomBarHome } from "./_ui/map-bottom-bar-home"
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
	} else {
		redirect("/onboarding")
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<div className="h-screen absolute top-0 left-0 w-full bg-(--map-background)" />
			<div className="flex flex-col">
				<MapViewerHome>
					<MapViewer3D />
				</MapViewerHome>
				<ScheduleViewerHome>
					<div className="-mt-4 flex flex-col bg-background rounded-t-3xl relative pb-(--safe-area-inset-bottom) mb-16">
						<div className="absolute bottom-full left-3 py-2">
							<MapBottomBarHome>
								<MapBottomBar />
							</MapBottomBarHome>
						</div>
						<ScheduleHeader />
						<SaveCurrentGroupAsUser />
						<ScheduleViewer />
						<DebugResetUserGroupButton />
					</div>
				</ScheduleViewerHome>
			</div>
			<RouteNavigation />
		</HydrationBoundary>
	)
}
