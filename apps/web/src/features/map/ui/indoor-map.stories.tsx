import type { Meta, StoryObj } from "@storybook/react-vite"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"
import type { BuildingScheme } from "@repo/shared/building-scheme"

import scheme from "../../../../../../scripts/v3.json"
import type { IndoorRoutePoint } from "../lib/indoor-geometry"
import type { IndoorScene, IndoorView } from "../lib/indoor-scene"
import { IndoorMapCanvas } from "./indoor-map-canvas"
import { PositionControls } from "./position-controls"
import { RoomModal } from "./room-modal"
import { RouteBuilderModal } from "./route-builder-modal"

const data = scheme as BuildingScheme

const IndoorPreview = ({
	theme = "light" as "light" | "dark",
	mobile = false,
}) => {
	const [queryClient] = useState(() => {
		const client = new QueryClient({
			defaultOptions: { queries: { enabled: false, retry: false } },
		})
		client.setQueryData(orpc.map.getMap.queryOptions().queryKey, data)
		client.setQueryData(orpc.users.me.queryOptions().queryKey, {
			id: 0,
			telegramId: null,
			isEnabledNotifications: false,
			isAdmin: undefined,
			group: null,
		})
		return client
	})
	const [floorId, setFloorId] = useState(data.floors[0].id)
	const [selected, setSelected] = useState<number | null>(null)
	const [view, setView] = useState<IndoorView>("3d")
	const [showRoute, setShowRoute] = useState(false)
	const [failed, setFailed] = useState(false)
	const sceneRef = useRef<IndoorScene | null>(null)
	const floor = data.floors.find((f) => f.id === floorId) ?? data.floors[0]
	const road = floor.roads?.toSorted(
		(a, b) =>
			Math.hypot(b.end.x - b.start.x, b.end.y - b.start.y) -
			Math.hypot(a.end.x - a.start.x, a.end.y - a.start.y),
	)[0]
	const route: IndoorRoutePoint[] | undefined =
		showRoute && road
			? [
					{ ...road.start, floor: floorId, type: "road" },
					{ ...road.end, floor: floorId, type: "road" },
				]
			: undefined
	return (
		<QueryClientProvider client={queryClient}>
			<div className={theme === "dark" ? "dark" : ""}>
				<div
					className="relative mx-auto overflow-hidden bg-(--map-background) text-foreground"
					style={{
						width: mobile ? 390 : "100%",
						maxWidth: "100%",
						height: mobile ? 844 : "100vh",
					}}
				>
					<IndoorMapCanvas
						data={data}
						activeFloor={floorId}
						selectedRoomId={selected}
						theme={theme}
						view={view}
						route={route}
						sceneRef={sceneRef}
						onSelect={setSelected}
						onFloor={setFloorId}
						onError={() => setFailed(true)}
					/>
					<div className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border border-border bg-background p-1">
						{data.floors.map((f) => (
							<button
								key={f.id}
								type="button"
								className="size-9 rounded-xl text-sm aria-pressed:bg-accent aria-pressed:text-accent-foreground"
								aria-label={f.name}
								aria-pressed={f.id === floorId}
								onClick={() => {
									setSelected(null)
									setFloorId(f.id)
								}}
							>
								{f.acronym ?? f.id}
							</button>
						))}
					</div>
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<PositionControls
							zoomByStep={(factor) => sceneRef.current?.zoom(factor)}
							view={view}
							onToggleView={() => setView(view === "3d" ? "top" : "3d")}
						/>
					</div>
					<div className="absolute inset-x-3 bottom-6 mx-auto flex max-w-md flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-background p-4 text-sm">
						<span>{floor.name}</span>
						<button
							className="indoor-action"
							type="button"
							onClick={() => setShowRoute(!showRoute)}
						>
							{showRoute ? "Убрать маршрут" : "Показать маршрут"}
						</button>
						{failed && <span role="alert">3D недоступен</span>}
					</div>
				</div>
			</div>
			<RoomModal roomId={selected} onClose={() => setSelected(null)} />
			<RouteBuilderModal />
		</QueryClientProvider>
	)
}

const meta = {
	id: "map-indoor",
	title: "Карта/3D Indoor",
	component: IndoorPreview,
	globals: { theme: "light" },
	args: { theme: "light", mobile: false },
} satisfies Meta<typeof IndoorPreview>
export default meta
type Story = StoryObj<typeof meta>
export const Light: Story = { name: "Открытый этаж" }
export const Dark: Story = {
	name: "Тёмная тема",
	args: { theme: "dark" },
	globals: { theme: "dark" },
}
export const Mobile: Story = { name: "Мобильная карта", args: { mobile: true } }
