import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

import { useFilteredFloors } from "../hooks/use-filtered-floors"
import { useMapData } from "../hooks/use-map-data"

import "./floor-control.css"

type FloorControlsProps = {
	activeFloor: number
	onChangeFloor: (floorId: number) => void
}

export const FloorControls = ({
	activeFloor,
	onChangeFloor,
}: FloorControlsProps) => {
	const mapData = useMapData()
	const midisFloors = useFilteredFloors(mapData, 0)
	const schoolFloors = useFilteredFloors(mapData, 1)
	const campuses = [
		{ name: "МИДИС", icon: "midis" as const, floors: midisFloors },
		{ name: "Школа", icon: "seven" as const, floors: schoolFloors },
	]
	return (
		<div className="floor-control flex flex-col items-stretch gap-1 overflow-hidden rounded-3xl border border-border bg-background p-1">
			{campuses.map(({ name, icon, floors }) =>
				floors?.length ? (
					<div
						key={name}
						role="group"
						aria-label={`Этажи: ${name}`}
						className="flex flex-col"
					>
						<div
							className="grid h-9 place-items-center"
							title={name}
							aria-hidden="true"
						>
							<Icon name={icon} size={24} />
						</div>
						<div className="relative flex flex-col">
							{floors.map((floor) => (
								<Touchable key={floor.id}>
									<button
										type="button"
										className="size-11 shrink-0 rounded-full text-sm grid place-items-center transition-colors bg-background aria-pressed:bg-accent aria-pressed:text-accent-foreground"
										aria-label={floor.name}
										aria-pressed={activeFloor === floor.id}
										onClick={() => onChangeFloor(floor.id)}
									>
										{floor.acronym ?? floor.name}
									</button>
								</Touchable>
							))}
						</div>
					</div>
				) : null,
			)}
		</div>
	)
}
