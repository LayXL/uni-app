import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import { AddHomeworkButton } from "@/app/(morda)/homework/_ui/add-homework-button"
import {
	HomeworkList,
	HomeworkListSkeleton,
} from "@/app/(morda)/homework/_ui/homework-list"

export const Route = createFileRoute("/_app/homework/")({
	component: HomeworkPage,
})

function HomeworkPage() {
	return (
		<>
			<div className="flex min-h-screen flex-col pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
				<h1 className="mb-4 px-4 text-2xl font-semibold">Домашние задания</h1>
				<Suspense fallback={<HomeworkListSkeleton />}>
					<HomeworkList />
				</Suspense>
			</div>
			<AddHomeworkButton />
		</>
	)
}
