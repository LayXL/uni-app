import { HydrationBoundary } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { Fetcher } from "@/shared/utils/fetcher"

import { AddHomeworkButton } from "./_ui/add-homework-button"
import { HomeworkList } from "./_ui/homework-list"

export default async function HomeworkPage() {
	const fetcher = new Fetcher()

	await fetcher.fetch(orpc.homeworks.getHomeworks)

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<div className="flex min-h-screen flex-col pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
				<h1 className="mb-4 px-4 text-2xl font-semibold">Домашние задания</h1>
				<HomeworkList />
			</div>
			<AddHomeworkButton />
		</HydrationBoundary>
	)
}
