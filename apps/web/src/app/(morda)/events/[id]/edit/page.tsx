import { HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { orpc } from "@repo/orpc/react"

import { Fetcher } from "@/shared/utils/fetcher"

import EditEventClient from "./_ui/edit-event-client"

type EditEventPageProps = {
	params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
	const { id } = await params
	const numericId = Number(id)

	if (!Number.isFinite(numericId)) {
		notFound()
	}

	const fetcher = new Fetcher()

	try {
		await fetcher.fetch(orpc.events.getAllEvents)
	} catch {
		notFound()
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<EditEventClient id={numericId} />
		</HydrationBoundary>
	)
}
