"use client"

import { Sphere } from "@react-three/drei"
import { useMemo } from "react"

import type { Coordinate, Place } from "@repo/shared/building-scheme"

import { getMapColors } from "../lib/colors"
import { MAP_3D_CONSTANTS } from "../lib/geometry-3d"

type Place3DProps = {
	place: Place
	floorOffset: Coordinate
}

export const Place3D = ({ place, floorOffset }: Place3DProps) => {
	const colors = useMemo(() => getMapColors(), [])

	const position: [number, number, number] = [
		floorOffset.x + place.position.x,
		MAP_3D_CONSTANTS.ROOM_ELEVATION + MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT + 2,
		-(floorOffset.y + place.position.y),
	]

	return (
		<group position={position}>
			{/* Place marker sphere */}
			<Sphere args={[3, 16, 16]}>
				<meshStandardMaterial
					color={colors.roomStroke}
					roughness={0.5}
					metalness={0.3}
				/>
			</Sphere>
		</group>
	)
}
