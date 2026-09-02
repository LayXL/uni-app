import { Suspense } from "react"

import {
	HomeworkDetailPage,
	HomeworkDetailSkeleton,
} from "../_ui/homework-detail"

export default function HomeworkPage() {
	return (
		<Suspense fallback={<HomeworkDetailSkeleton />}>
			<HomeworkDetailPage />
		</Suspense>
	)
}
