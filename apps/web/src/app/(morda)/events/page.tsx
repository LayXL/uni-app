import { HydrationBoundary } from "@tanstack/react-query"
import Link from "next/link"

import { orpc } from "@repo/orpc/react"

import { Button } from "@/shared/ui/button"
import { PageTitle } from "@/shared/ui/page-title"
import { Fetcher } from "@/shared/utils/fetcher"

import { EventsList } from "./_ui/events-list"

export default async function EventsPage() {
	const fetcher = new Fetcher()

	await fetcher.fetch(orpc.events.getAllEvents)

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<div className="flex flex-col pt-[calc(var(--safe-area-inset-top)+1rem)] min-h-screen">
				<div className="px-4">
					<PageTitle title="События" />
				</div>
				<EventsList />
				<div className="px-4 mt-4">
					<Button
						asChild
						label="Создать событие"
						leftIcon="iconify:material-symbols:add"
					>
						<Link href="/events/new" />
					</Button>
				</div>
			</div>
		</HydrationBoundary>
	)
}
