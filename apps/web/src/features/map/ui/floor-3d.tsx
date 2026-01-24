"use client"

import { useMemo } from "react"
import * as THREE from "three"

import type { Floor, Room } from "@repo/shared/building-scheme"

import {
	MAP_3D_CONSTANTS,
	createFloorShape,
	createWallSegments,
} from "../lib/geometry-3d"
import { getMapColors } from "../lib/colors"

type Floor3DProps = {
	floor: Floor
	rooms: Room[]
}

export const Floor3D = ({ floor }: Floor3DProps) => {
	const colors = useMemo(() => getMapColors(), [])

	const floorGeometry = useMemo(() => {
		const shape = createFloorShape(floor)

		const extrudeSettings: THREE.ExtrudeGeometryOptions = {
			depth: MAP_3D_CONSTANTS.FLOOR_HEIGHT,
			bevelEnabled: false,
		}

		return new THREE.ExtrudeGeometry(shape, extrudeSettings)
	}, [floor])

	const wallSegments = useMemo(
		() => createWallSegments(floor.wallsPosition, floor.position),
		[floor],
	)

	return (
		<group>
			{/* Floor base */}
			<mesh
				geometry={floorGeometry}
				position={[0, 0, MAP_3D_CONSTANTS.FLOOR_ELEVATION]}
				rotation={[-Math.PI / 2, 0, 0]}
			>
				<meshStandardMaterial color={colors.floorFill} />
			</mesh>

			{/* Floor walls */}
			{wallSegments.map((segment, index) => (
				<mesh
					key={index}
					position={[
						segment.centerX,
						MAP_3D_CONSTANTS.FLOOR_ELEVATION + MAP_3D_CONSTANTS.WALL_HEIGHT / 2,
						-segment.centerY,
					]}
					rotation={[0, -segment.angle, 0]}
				>
					<boxGeometry
						args={[
							segment.length,
							MAP_3D_CONSTANTS.WALL_HEIGHT,
							MAP_3D_CONSTANTS.WALL_THICKNESS,
						]}
					/>
					<meshStandardMaterial color={colors.floorStroke} />
				</mesh>
			))}
		</group>
	)
}
