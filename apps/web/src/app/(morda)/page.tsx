import { Suspense } from "react"

import {
	SchedulePageContent,
	SchedulePageSkeleton,
} from "./_ui/schedule-page-content"

export default function SchedulePage() {
	return (
		<>
			<link
				rel="preload"
				href="/images/secretscode-channel-v2.webp"
				as="image"
				type="image/webp"
			/>
			<div className="flex min-h-screen flex-col pt-(--safe-area-inset-top) pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
				<Suspense fallback={<SchedulePageSkeleton />}>
					<SchedulePageContent />
				</Suspense>
			</div>
		</>
	)
}
