"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { cn } from "@/shared/utils/cn"

export const MapViewer = () => {
	const { data } = useQuery(orpc.map.getMap.queryOptions())

	const [activeCampus, setActiveCampus] = useState<number>(0)
	const [activeFloor, setActiveFloor] = useState<number>(0)

	return (
		<div className="relative">
			<div className="absolute top-2 left-2 bg-card border-border flex flex-col gap-2 rounded-lg">
				<button
					type="button"
					className="size-8 text-xs grid place-items-center"
					onClick={() => setActiveCampus(activeCampus === 0 ? 1 : 0)}
				>
					{activeCampus === 0 ? "МИДИС" : "Школа"}
				</button>
				{data
					?.filter(
						(floor) => floor.name.includes("школы") === (activeCampus === 1),
					)
					.map((floor) => (
						<button
							key={floor.id}
							type="button"
							className={cn(
								"size-8 text-xs grid place-items-center rounded-lg",
								activeFloor === floor.id && "bg-accent text-accent-foreground",
							)}
							onClick={() => setActiveFloor(floor.id)}
						>
							{floor.acronym}
						</button>
					))}
			</div>
			<canvas className="w-full h-full" />
		</div>
	)
}
