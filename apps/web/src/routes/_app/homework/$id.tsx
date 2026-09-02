import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import {
	HomeworkDetailPage,
	HomeworkDetailSkeleton,
} from "@/app/(morda)/homework/_ui/homework-detail"

export const Route = createFileRoute("/_app/homework/$id")({
	component: HomeworkPage,
})

function HomeworkPage() {
	const { id } = Route.useParams()

	return (
		<Suspense fallback={<HomeworkDetailSkeleton />}>
			<HomeworkDetailPage id={id} />
		</Suspense>
	)
}
