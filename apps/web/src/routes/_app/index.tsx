import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import {
	SchedulePageContent,
	SchedulePageSkeleton,
} from "@/app/(morda)/_ui/schedule-page-content"

export const Route = createFileRoute("/_app/")({
	head: () => ({
		links: [
			{
				rel: "preload",
				href: "/images/secretscode-channel-v2.webp",
				as: "image",
				type: "image/webp",
			},
		],
	}),
	component: SchedulePage,
})

function SchedulePage() {
	return (
		<div className="flex min-h-screen flex-col pt-(--safe-area-inset-top) pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
			<Suspense fallback={<SchedulePageSkeleton />}>
				<SchedulePageContent />
			</Suspense>
		</div>
	)
}
