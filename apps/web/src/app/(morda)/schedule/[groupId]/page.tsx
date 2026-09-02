import { Suspense } from "react"

import {
	GroupSchedulePageContent,
	GroupScheduleSkeleton,
} from "./_ui/group-schedule-page-content"

export default function SchedulePage() {
	return (
		<Suspense fallback={<GroupScheduleSkeleton />}>
			<GroupSchedulePageContent />
		</Suspense>
	)
}
