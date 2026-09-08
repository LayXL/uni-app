"use client"

import { lazy, useState } from "react"

const IndoorMapViewer = lazy(() =>
	import("./indoor-map-viewer").then((module) => ({
		default: module.IndoorMapViewer,
	})),
)
const FlatMapViewer = lazy(() =>
	import("./map-viewer-2d").then((module) => ({ default: module.MapViewer })),
)

export const MapViewer = ({
	initialRoomId,
	active = true,
}: {
	initialRoomId?: number
	active?: boolean
}) => {
	const [fallback, setFallback] = useState(false)
	return (
		<>
			{fallback ? (
				<div className="relative size-full">
					<FlatMapViewer initialRoomId={initialRoomId} active={active} />
					<p
						role="status"
						className="absolute left-3 bottom-[calc(var(--tab-bar-height,0px)+var(--safe-area-inset-bottom,0px)+6rem)] max-w-[calc(100%-5rem)] rounded-2xl bg-background px-3 py-2 text-xs text-muted"
					>
						3D недоступен на этом устройстве. Открыта 2D карта.
					</p>
				</div>
			) : (
				<IndoorMapViewer
					active={active}
					initialRoomId={initialRoomId}
					onUnavailable={() => setFallback(true)}
				/>
			)}
		</>
	)
}
