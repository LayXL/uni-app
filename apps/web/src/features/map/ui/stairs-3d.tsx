"use client"

import { Cylinder } from "@react-three/drei"
import { useMemo } from "react"

import type { Coordinate, Stair } from "@repo/shared/building-scheme"

import { getMapColors } from "../lib/colors"
import { MAP_3D_CONSTANTS } from "../lib/geometry-3d"

type Stairs3DProps = {
	stair: Stair
	floorOffset: Coordinate
}

export const Stairs3D = ({ stair, floorOffset }: Stairs3DProps) => {
	const colors = useMemo(() => getMapColors(), [])

	const position: [number, number, number] = [
		floorOffset.x + stair.position.x,
		MAP_3D_CONSTANTS.ROOM_ELEVATION + MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT / 2,
		-(floorOffset.y + stair.position.y),
	]

	return (
		<group position={position}>
			{/* Stairs cylinder marker */}
			<Cylinder
				args={[6, 6, MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT, 16]}
			>
				<meshStandardMaterial
					color={colors.roomStroke}
					roughness={0.6}
					metalness={0.2}
				/>
			</Cylinder>

			{/* Top cap with icon indicator */}
			<Cylinder
				args={[4, 4, 1, 16]}
				position={[0, MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT / 2 + 0.5, 0]}
			>
				<meshStandardMaterial
					color="#ffffff"
					roughness={0.3}
					metalness={0.1}
				/>
			</Cylinder>
		</group>
	)
}
