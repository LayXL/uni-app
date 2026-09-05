import { createFileRoute } from "@tanstack/react-router"

import MapEditorPage from "@/app/(morda)/settings/map/page"

export const Route = createFileRoute("/_app/settings/map")({
	component: MapEditorPage,
})
