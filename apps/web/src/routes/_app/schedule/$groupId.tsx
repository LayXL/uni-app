import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import {
	GroupSchedulePageContent,
	GroupScheduleSkeleton,
} from "@/app/(morda)/schedule/[groupId]/_ui/group-schedule-page-content"

export const Route = createFileRoute("/_app/schedule/$groupId")({
	component: SchedulePage,
})

function SchedulePage() {
	const { groupId } = Route.useParams()

	return (
		<Suspense fallback={<GroupScheduleSkeleton />}>
			<GroupSchedulePageContent groupIdParam={groupId} />
		</Suspense>
	)
}
