import { HydrationBoundary } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { MapBottomBar } from "@/features/map/ui/map-bottom-bar"
import { MapViewer } from "@/features/map/ui/map-viewer"
import { RouteNavigation } from "@/features/map/ui/route-navigation"
import { Fetcher } from "@/shared/utils/fetcher"

import { SettingsButton } from "../_ui/settings-button"

type MapPageProps = {
	searchParams: Promise<{ room?: string }>
}

export default async function MapPage({ searchParams }: MapPageProps) {
	const fetcher = new Fetcher()
	const { room } = await searchParams
	const initialRoomId = room ? Number(room) : undefined

	await fetcher.fetch(orpc.map.getMap)

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<div className="fixed inset-0 bg-(--map-background)">
				<MapViewer
					initialRoomId={
						Number.isInteger(initialRoomId) ? initialRoomId : undefined
					}
				/>
				<div className="absolute bottom-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.5rem)] left-[calc(var(--safe-area-inset-left)+0.75rem)] z-10">
					<MapBottomBar />
				</div>
				<SettingsButton />
				<RouteNavigation />
			</div>
		</HydrationBoundary>
	)
}
