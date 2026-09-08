"use client"

import { useSuspenseQuery } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { MapBottomBar } from "@/features/map/ui/map-bottom-bar"
import { MapViewer } from "@/features/map/ui/map-viewer"
import { RouteNavigation } from "@/features/map/ui/route-navigation"

import { SettingsButton } from "../../_ui/settings-button"

type MapPageProps = { initialRoomId?: number; active?: boolean }

const MapPageView = ({ initialRoomId, active = true }: MapPageProps) => (
	<div className="fixed inset-0 bg-(--map-background)">
		<MapViewer initialRoomId={initialRoomId} active={active} />
		{active && (
			<>
				<div className="absolute bottom-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.5rem)] left-[max(0.75rem,var(--safe-area-inset-left))] right-[max(0.75rem,var(--safe-area-inset-right))] z-20 mx-auto max-w-lg">
					<MapBottomBar />
				</div>
				<SettingsButton className="top-[calc(var(--safe-area-inset-top,0px)+4.25rem)]" />
				<RouteNavigation />
			</>
		)}
	</div>
)

export const MapPageContent = ({
	initialRoomId,
	active = true,
}: MapPageProps) => {
	useSuspenseQuery(orpc.map.getMap.queryOptions())

	return <MapPageView initialRoomId={initialRoomId} active={active} />
}
