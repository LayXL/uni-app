import { useMatch } from "@tanstack/react-router"
import { lazy, Suspense, useEffect, useState } from "react"

const MapPageContent = lazy(() =>
	import("./map-page-content").then((module) => ({
		default: module.MapPageContent,
	})),
)

export function SessionMap() {
	const match = useMatch({ from: "/_app/map", shouldThrow: false })
	const active = Boolean(match)
	const [visited, setVisited] = useState(false)
	useEffect(() => {
		if (active) setVisited(true)
	}, [active])

	if (!active && !visited) return null

	return (
		<div
			aria-hidden={!active}
			inert={!active}
			className="fixed inset-0"
			style={{ visibility: active ? "visible" : "hidden" }}
		>
			<Suspense
				fallback={
					<div
						role="status"
						className="grid size-full place-items-center bg-(--map-background) text-sm text-muted"
					>
						Загрузка карты…
					</div>
				}
			>
				<MapPageContent active={active} initialRoomId={match?.search.room} />
			</Suspense>
		</div>
	)
}
