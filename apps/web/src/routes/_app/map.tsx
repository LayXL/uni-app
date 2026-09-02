import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import {
	MapPageContent,
	MapPageSkeleton,
} from "@/app/(morda)/map/_ui/map-page-content"

type MapSearch = {
	room?: number
}

export const Route = createFileRoute("/_app/map")({
	validateSearch: (search: Record<string, unknown>): MapSearch => {
		const room = Number(search.room)
		return Number.isInteger(room) ? { room } : {}
	},
	component: MapPage,
})

function MapPage() {
	const { room } = Route.useSearch()

	return (
		<Suspense fallback={<MapPageSkeleton />}>
			<MapPageContent initialRoomId={room} />
		</Suspense>
	)
}
