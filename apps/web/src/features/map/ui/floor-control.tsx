import { motion, useReducedMotion } from "motion/react"

import { Touchable } from "@/shared/ui/touchable"

import { useMapData } from "../hooks/use-map-data"
import { floorLevel } from "../lib/campus-layout"

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
	const shouldReduceMotion = useReducedMotion()
	const floors = mapData.floors
		.filter(
			(floor, index, all) =>
				all.findIndex((other) => floorLevel(other) === floorLevel(floor)) ===
				index,
		)
		.toSorted((a, b) => floorLevel(b) - floorLevel(a))
	const active = mapData.floors.find((floor) => floor.id === activeFloor)
	const activeIndex = floors.findIndex(
		(floor) => active && floorLevel(floor) === floorLevel(active),
	)

	return (
		<div className="floor-control flex flex-col items-stretch gap-1 overflow-hidden rounded-3xl border border-border bg-background/90 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl">
			<div
				role="group"
				aria-label="Этажи вуза и школы"
				className="relative isolate flex flex-col"
			>
				{activeIndex >= 0 && (
					<motion.span
						aria-hidden="true"
						className="pointer-events-none absolute left-0 top-0 -z-10 size-11 rounded-full bg-accent/10"
						initial={false}
						animate={{ y: `${activeIndex * 100}%` }}
						transition={
							shouldReduceMotion
								? { duration: 0 }
								: { type: "spring", stiffness: 500, damping: 38, mass: 0.7 }
						}
					/>
				)}
				{floors.map((floor) => (
					<Touchable key={floor.id}>
						<button
							type="button"
							className="size-11 shrink-0 rounded-full text-lg font-medium grid place-items-center text-muted transition-colors aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
							aria-label={`${floorLevel(floor)} этаж`}
							aria-pressed={
								!!active && floorLevel(active) === floorLevel(floor)
							}
							onClick={() => onChangeFloor(floor.id)}
						>
							{floor.acronym ?? floorLevel(floor)}
						</button>
					</Touchable>
				))}
			</div>
		</div>
	)
}
