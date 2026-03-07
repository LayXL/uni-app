import { HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { orpc } from "@repo/orpc/react"

import { Fetcher } from "@/shared/utils/fetcher"

import { HomeworkDetail } from "../_ui/homework-detail"

type HomeworkPageProps = {
	params: Promise<{ id: string }>
}

export default async function HomeworkPage({ params }: HomeworkPageProps) {
	const { id } = await params
	const fetcher = new Fetcher()

	try {
		await fetcher.fetch(orpc.homeworks.getHomework, { id })
	} catch {
		notFound()
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<HomeworkDetail id={id} />
		</HydrationBoundary>
	)
}
