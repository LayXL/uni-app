import { useEffect, useState } from "react"

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

	const [activeCampus, setActiveCampus] = useState<number>(0)

	const midisFloors = useFilteredFloors(mapData, 0)
	const schoolFloors = useFilteredFloors(mapData, 1)
	const campuses = [midisFloors, schoolFloors]
	const floorCount = campuses[activeCampus]?.length ?? 0
	const floorCampus = mapData.floors
		.find((floor) => floor.id === activeFloor)
		?.name.includes("школы")
		? 1
		: 0
	useEffect(() => {
		setActiveCampus(floorCampus)
	}, [floorCampus])

	return (
		<div
			className="floor-control t-page-slide t-resize w-[calc(2rem+2px)] overflow-hidden bg-background border border-border rounded-3xl"
			data-page={activeCampus === 0 ? "2" : "1"}
			style={{ height: `calc(${floorCount + 1} * 2rem + 2px)` }}
		>
			<Touchable>
				<button
					type="button"
					className="relative size-8 text-xs grid place-items-center bg-background rounded-3xl"
					aria-label={
						activeCampus === 0
							? "Показать этажи школы"
							: "Показать этажи МИДИСа"
					}
					onClick={() => setActiveCampus((campus) => (campus === 0 ? 1 : 0))}
				>
					<span
						className="t-page grid place-items-center"
						data-page-id="2"
						aria-hidden="true"
					>
						<Icon name="midis" size={24} />
					</span>
					<span
						className="t-page grid place-items-center"
						data-page-id="1"
						aria-hidden="true"
					>
						<Icon name="seven" size={24} />
					</span>
				</button>
			</Touchable>
			{campuses.map((floors, campus) => {
				const activeIndex =
					floors?.findIndex((floor) => floor.id === activeFloor) ?? -1

				return (
					<div
						key={campus}
						className="t-page t-tabs floor-control-floors flex flex-col"
						data-page-id={campus === 0 ? "2" : "1"}
						inert={activeCampus !== campus}
						aria-hidden={activeCampus !== campus}
					>
						{activeIndex >= 0 && (
							<span
								className="t-tabs-pill"
								aria-hidden="true"
								style={{ transform: `translateY(${activeIndex * 100}%)` }}
							/>
						)}
						{floors?.map((floor) => (
							<Touchable key={floor.id}>
								<button
									type="button"
									className="t-tab size-8 shrink-0 text-sm grid place-items-center rounded-3xl"
									aria-label={floor.name}
									aria-pressed={activeFloor === floor.id}
									onClick={() => onChangeFloor(floor.id)}
								>
									{floor.acronym ?? floor.name}
								</button>
							</Touchable>
						))}
					</div>
				)
			})}
		</div>
	)
}
