import type { Meta, StoryObj } from "@storybook/react-vite"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"
import type { BuildingScheme } from "@repo/shared/building-scheme"

import { FloorControls } from "./floor-control"

const mapData: BuildingScheme = {
	entities: [],
	floors: [
		...[1, 2, 3, 4].map((floor) => ({
			id: floor,
			name: `${floor} этаж МИДИСа`,
			acronym: String(floor),
			position: { x: 0, y: 0 },
			wallsPosition: [],
		})),
		...[1, 2].map((floor) => ({
			id: floor + 10,
			name: `${floor} этаж школы`,
			acronym: String(floor),
			position: { x: 0, y: 0 },
			wallsPosition: [],
		})),
	],
}

const FloorControlsPreview = () => {
	const [activeFloor, setActiveFloor] = useState(1)
	const [queryClient] = useState(() => {
		const client = new QueryClient({
			defaultOptions: { queries: { staleTime: Infinity } },
		})
		client.setQueryData(orpc.map.getMap.queryKey(), mapData)
		return client
	})

	return (
		<QueryClientProvider client={queryClient}>
			<div className="flex min-h-screen items-center justify-center gap-8 bg-(--map-background)">
				<FloorControls
					activeFloor={activeFloor}
					onChangeFloor={setActiveFloor}
				/>
				<p className="text-sm text-muted">
					{mapData.floors.find((floor) => floor.id === activeFloor)?.name}
				</p>
			</div>
		</QueryClientProvider>
	)
}

const meta = {
	title: "Карта/Переключатель этажей",
	component: FloorControls,
	args: { activeFloor: 1, onChangeFloor: () => {} },
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FloorControls>

export default meta
type Story = StoryObj<typeof meta>

export const CampusSlide: Story = {
	name: "МИДИС ↔ школа",
	render: () => <FloorControlsPreview />,
}
