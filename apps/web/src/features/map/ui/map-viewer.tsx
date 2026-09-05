"use client"

import { lazy, Suspense, useState } from "react"

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
		<Suspense
			fallback={
				<div
					role="status"
					className="grid size-full place-items-center text-sm text-muted"
				>
					Загрузка карты…
				</div>
			}
		>
			{fallback ? (
				<div className="relative size-full">
					<FlatMapViewer initialRoomId={initialRoomId} active={active} />
					<p
						role="status"
						className="absolute left-3 top-[calc(var(--safe-area-inset-top,0px)+1rem)] max-w-[calc(100%-5rem)] rounded-2xl bg-background px-3 py-2 text-xs text-muted"
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
		</Suspense>
	)
}
