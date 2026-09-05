import { createFileRoute } from "@tanstack/react-router"

import { useDisableTelegramSwipes } from "@/shared/hooks/use-disable-telegram-swipes"

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
	useDisableTelegramSwipes()
	// The session layer owns the map so route changes do not destroy its canvas.
	return null
}
