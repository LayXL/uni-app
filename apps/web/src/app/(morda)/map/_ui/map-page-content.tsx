"use client"

import { useQuery } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { MapBottomBar } from "@/features/map/ui/map-bottom-bar"
import { MapViewer } from "@/features/map/ui/map-viewer"
import { RouteNavigation } from "@/features/map/ui/route-navigation"
import { useIsClient } from "@/shared/hooks/use-is-client"

import { SettingsButton } from "../../_ui/settings-button"

export const MapPageSkeleton = () => (
	<div
		role="status"
		aria-busy="true"
		aria-label="Загрузка карты"
		className="fixed inset-0 grid place-items-center bg-(--map-background)"
	>
		<div className="size-16 animate-pulse rounded-3xl bg-card" />
	</div>
)

const MapPageView = ({ initialRoomId }: { initialRoomId?: number }) => (
	<div className="fixed inset-0 bg-(--map-background)">
		<MapViewer initialRoomId={initialRoomId} />
		<div className="absolute bottom-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.5rem)] left-[calc(var(--safe-area-inset-left)+0.75rem)] z-20">
			<MapBottomBar />
		</div>
		<SettingsButton />
		<RouteNavigation />
	</div>
)

export const MapPageContent = ({
	initialRoomId,
}: {
	initialRoomId?: number
}) => {
	const isClient = useIsClient()
	const mapQuery = useQuery({
		...orpc.map.getMap.queryOptions(),
		enabled: isClient,
	})

	if (mapQuery.error) throw mapQuery.error
	if (!isClient || mapQuery.isPending) return <MapPageSkeleton />

	return <MapPageView initialRoomId={initialRoomId} />
}
