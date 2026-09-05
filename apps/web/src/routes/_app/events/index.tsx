import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense } from "react"

import { EventsList } from "@/app/(morda)/events/_ui/events-list"
import { Button } from "@/shared/ui/button"
import { PageTitle } from "@/shared/ui/page-title"

export const Route = createFileRoute("/_app/events/")({
	component: EventsPage,
})

function EventsPage() {
	return (
		<div className="flex min-h-screen flex-col pt-[calc(var(--safe-area-inset-top)+1rem)]">
			<div className="px-4">
				<PageTitle title="События" />
			</div>
			<Suspense fallback={null}>
				<EventsList />
			</Suspense>
			<div className="mt-4 px-4">
				<Button
					asChild
					label="Создать событие"
					leftIcon="iconify:material-symbols:add"
				>
					<Link to="/events/new" />
				</Button>
			</div>
		</div>
	)
}
