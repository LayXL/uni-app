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
			<div className="flex flex-col pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--safe-area-inset-bottom)+5rem)]">
				<h1 className="px-4 text-xl font-bold">Домашние задания</h1>
				<HomeworkList />
			</div>
			<AddHomeworkButton />
		</HydrationBoundary>
	)
}
