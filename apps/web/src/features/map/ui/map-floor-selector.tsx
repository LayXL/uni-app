import { useState } from "react"

import type { BuildingScheme } from "@repo/shared/building-scheme"

import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

import { useFilteredFloors } from "../hooks/use-filtered-floors"

type MapFloorSelectorProps = {
	activeFloor: number
	onChangeFloor: (floorId: number) => void
	mapData: BuildingScheme | undefined
}

export const MapFloorSelector = ({
	mapData,
	activeFloor,
	onChangeFloor,
}: MapFloorSelectorProps) => {
	const [activeCampus, setActiveCampus] = useState<number>(0)

	const filteredFloors = useFilteredFloors(mapData, activeCampus)

	return (
		<div className="bg-background border border-border flex flex-col rounded-3xl">
			<Touchable>
				<button
					type="button"
					className="size-8 text-xs grid place-items-center bg-background rounded-3xl"
					onClick={() => setActiveCampus(activeCampus === 0 ? 1 : 0)}
				>
					<Icon name={activeCampus === 0 ? "midis" : "seven"} size={24} />
				</button>
			</Touchable>
			{filteredFloors?.map((floor) => (
				<Touchable key={floor.id}>
					<button
						type="button"
						className={cn(
							"size-8 text-sm grid place-items-center bg-background rounded-3xl",
							activeFloor === floor.id && "bg-accent text-accent-foreground",
						)}
						onClick={() => onChangeFloor(floor.id)}
					>
						{floor.acronym ?? floor.name}
					</button>
				</Touchable>
			))}
		</div>
	)
}
