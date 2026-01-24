"use client"

import { Text } from "@react-three/drei"
import type { ThreeEvent } from "@react-three/fiber"
import { useMemo, useState } from "react"
import * as THREE from "three"

import type { Coordinate, Room } from "@repo/shared/building-scheme"

import { getMapColors } from "../lib/colors"
import {
	MAP_3D_CONSTANTS,
	createRoomShape,
	createWallSegments,
	getPolygonCentroid,
} from "../lib/geometry-3d"

type Room3DProps = {
	room: Room
	floorOffset: Coordinate
	onClick?: (roomId: number) => void
}

export const Room3D = ({ room, floorOffset, onClick }: Room3DProps) => {
	const colors = useMemo(() => getMapColors(), [])
	const [hovered, setHovered] = useState(false)

	const roomGeometry = useMemo(() => {
		const shape = createRoomShape(room, floorOffset)

		const extrudeSettings: THREE.ExtrudeGeometryOptions = {
			depth: MAP_3D_CONSTANTS.ROOM_HEIGHT,
			bevelEnabled: false,
		}

		return new THREE.ExtrudeGeometry(shape, extrudeSettings)
	}, [room, floorOffset])

	// Inset room walls to avoid overlap with adjacent rooms and floor walls
	const wallInset = MAP_3D_CONSTANTS.WALL_THICKNESS

	const wallSegments = useMemo(
		() =>
			createWallSegments(
				room.wallsPosition,
				{
					x: floorOffset.x + room.position.x,
					y: floorOffset.y + room.position.y,
				},
				wallInset,
			),
		[room, floorOffset, wallInset],
	)

	const centroid = useMemo(
		() =>
			getPolygonCentroid(room.wallsPosition, {
				x: floorOffset.x + room.position.x,
				y: floorOffset.y + room.position.y,
			}),
		[room.wallsPosition, room.position, floorOffset],
	)

	const handleClick = (e: ThreeEvent<MouseEvent>) => {
		if (room.clickable && onClick) {
			e.stopPropagation()
			onClick(room.id)
		}
	}

	const handlePointerEnter = () => {
		if (room.clickable) {
			setHovered(true)
			document.body.style.cursor = "pointer"
		}
	}

	const handlePointerLeave = () => {
		setHovered(false)
		document.body.style.cursor = "default"
	}

	const fillColor = room.clickable
		? hovered
			? "#cbd5e1"
			: colors.roomFillClickable
		: colors.roomFill

	const wallColor = room.clickable
		? hovered
			? "#94a3b8"
			: colors.roomStroke
		: colors.roomStroke

	return (
		<group>
			{/* Room floor */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: mesh is interactive in R3F */}
			<mesh
				geometry={roomGeometry}
				position={[0, MAP_3D_CONSTANTS.ROOM_ELEVATION, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
				onClick={handleClick}
				onPointerEnter={handlePointerEnter}
				onPointerLeave={handlePointerLeave}
			>
				<meshStandardMaterial color={fillColor} />
			</mesh>

			{/* Room walls */}
			{wallSegments.map((segment, index) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: mesh is interactive in R3F
				<mesh
					key={index}
					position={[
						segment.centerX,
						MAP_3D_CONSTANTS.ROOM_ELEVATION +
							MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT / 2,
						-segment.centerY,
					]}
					rotation={[0, -segment.angle, 0]}
					onClick={handleClick}
					onPointerEnter={handlePointerEnter}
					onPointerLeave={handlePointerLeave}
				>
					<boxGeometry
						args={[
							segment.length,
							MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT,
							MAP_3D_CONSTANTS.WALL_THICKNESS,
						]}
					/>
					<meshStandardMaterial color={wallColor} />
				</mesh>
			))}

			{/* Room label */}
			{!room.nameHidden && !room.icon && (
				<Text
					position={[
						centroid.x,
						MAP_3D_CONSTANTS.ROOM_ELEVATION +
							MAP_3D_CONSTANTS.ROOM_WALL_HEIGHT +
							1,
						-centroid.y,
					]}
					rotation={[-Math.PI / 2, 0, 0]}
					fontSize={8}
					color={colors.roomLabel}
					anchorX="center"
					anchorY="middle"
				>
					{room.name}
				</Text>
			)}
		</group>
	)
}
