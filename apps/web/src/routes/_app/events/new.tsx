import { createFileRoute } from "@tanstack/react-router"

import NewEventPage from "@/app/(morda)/events/new/page"

export const Route = createFileRoute("/_app/events/new")({
	component: NewEventPage,
})
