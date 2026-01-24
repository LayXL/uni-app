"use client"

import { Line } from "@react-three/drei"
import { useMemo } from "react"

import type { Coordinate } from "@repo/shared/building-scheme"

import { getMapColors } from "../lib/colors"
import { MAP_3D_CONSTANTS } from "../lib/geometry-3d"

type RoutePoint = {
	floor: number
	x: number
	y: number
	type: "road" | "stairs"
	toFloor?: number | null
}

type Route3DProps = {
	route: RoutePoint[]
	activeFloor: number
	floorOffset: Coordinate
}

export const Route3D = ({ route, activeFloor, floorOffset }: Route3DProps) => {
	const colors = useMemo(() => getMapColors(), [])

	const segments = useMemo(() => {
		const floorPoints = route.filter((p) => p.floor === activeFloor)

		if (floorPoints.length < 2) return []

		// Group consecutive points into segments
		const chains: [number, number, number][][] = []
		let currentChain: [number, number, number][] = []

		for (let i = 0; i < route.length; i++) {
			const point = route[i]

			if (point.floor === activeFloor) {
				currentChain.push([
					point.x + floorOffset.x,
					MAP_3D_CONSTANTS.ROOM_ELEVATION + MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT + 1,
					-(point.y + floorOffset.y),
				])
			} else {
				if (currentChain.length >= 2) {
					chains.push([...currentChain])
				}
				currentChain = []
			}
		}

		// Don't forget the last chain
		if (currentChain.length >= 2) {
			chains.push(currentChain)
		}

		return chains
	}, [route, activeFloor, floorOffset])

	if (segments.length === 0) return null

	return (
		<group>
			{segments.map((points, index) => (
				<Line
					key={index}
					points={points}
					color={colors.route}
					lineWidth={4}
					dashed={false}
				/>
			))}
		</group>
	)
}
