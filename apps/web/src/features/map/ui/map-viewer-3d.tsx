"use client"

import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { skipToken, useQuery } from "@tanstack/react-query"
import { Suspense, useCallback, useMemo, useState } from "react"

import { orpc } from "@repo/orpc/react"
import type { Place, Room } from "@repo/shared/building-scheme"
import { isPlace, isRoom } from "@repo/shared/building-scheme"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useColorScheme } from "../hooks/use-color-scheme"
import { useMapData } from "../hooks/use-map-data"
import { useRouteBuilder } from "../hooks/use-route-builder"
import { calculateFloorBounds } from "../lib/geometry-3d"
import { Floor3D } from "./floor-3d"
import { MapControls } from "./map-controls"
import { Place3D } from "./place-3d"
import { RoomModal } from "./room-modal"
import { Room3D } from "./room-3d"
import { Route3D } from "./route-3d"
import { RouteBuilderModal } from "./route-builder-modal"
import { Stairs3D } from "./stairs-3d"

const MapScene = ({
	activeFloor,
	onRoomClick,
	route,
}: {
	activeFloor: number
	onRoomClick: (roomId: number) => void
	route?: Array<{
		floor: number
		x: number
		y: number
		type: "road" | "stairs"
		toFloor?: number | null
	}>
}) => {
	const mapData = useMapData()
	useColorScheme()

	const floor = mapData?.floors.find((f) => f.id === activeFloor)

	const floorRooms = useMemo(
		() =>
			mapData?.entities.filter(
				(e): e is Room => isRoom(e) && e.floorId === activeFloor,
			) ?? [],
		[mapData, activeFloor],
	)

	const floorPlaces = useMemo(
		() =>
			mapData?.entities.filter(
				(e): e is Place => isPlace(e) && e.floorId === activeFloor,
			) ?? [],
		[mapData, activeFloor],
	)

	const { center } = useMemo(() => {
		if (!floor) return { center: { x: 0, y: 0 }, width: 0, height: 0 }
		return calculateFloorBounds(floor, floorRooms)
	}, [floor, floorRooms])

	if (!floor || !mapData) return null

	return (
		<group position={[-center.x, 0, center.y]}>
			{/* Floor base */}
			<Floor3D floor={floor} rooms={floorRooms} />

			{/* Rooms */}
			{floorRooms.map((room) => (
				<Room3D
					key={room.id}
					room={room}
					floorOffset={floor.position}
					onClick={onRoomClick}
				/>
			))}

			{/* Places */}
			{floorPlaces.map((place) => (
				<Place3D
					key={place.id}
					place={place}
					floorOffset={floor.position}
				/>
			))}

			{/* Stairs */}
			{floor.stairs?.map((stair) => (
				<Stairs3D
					key={stair.id}
					stair={stair}
					floorOffset={floor.position}
				/>
			))}

			{/* Route */}
			{route && route.length > 0 && (
				<Route3D
					route={route}
					activeFloor={activeFloor}
					floorOffset={floor.position}
				/>
			)}
		</group>
	)
}

export const MapViewer3D = () => {
	const mapData = useMapData()

	const { start, end, isActive } = useRouteBuilder()

	const { data: routeData } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input: start && end ? { start, end } : skipToken,
		}),
	)

	const { activeFloor, setActiveFloor } = useActiveFloor()
	const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
	const [rotation, setRotation] = useState(0)

	const floor = mapData?.floors.find((f) => f.id === activeFloor)

	const floorRooms = useMemo(
		() =>
			mapData?.entities.filter(
				(e): e is Room => isRoom(e) && e.floorId === activeFloor,
			) ?? [],
		[mapData, activeFloor],
	)

	const { width, height } = useMemo(() => {
		if (!floor) return { width: 500, height: 500 }
		return calculateFloorBounds(floor, floorRooms)
	}, [floor, floorRooms])

	const cameraDistance = useMemo(() => {
		return Math.max(width, height) * 0.5
	}, [width, height])

	const zoomByStep = useCallback((_delta: number) => {
		// Zoom handled by OrbitControls
	}, [])

	const resetRotation = useCallback(() => {
		setRotation(0)
	}, [])

	const handleCenterOnFloor = useCallback(
		(floorId: number) => {
			setActiveFloor(floorId)
		},
		[setActiveFloor],
	)

	return (
		<div className="relative h-full w-full overflow-hidden bg-(--map-background)">
			<Canvas
				gl={{ antialias: true }}
				style={{ background: "var(--map-background, #f8fafc)" }}
			>
				<Suspense fallback={null}>
					{/* Camera */}
					<PerspectiveCamera
						makeDefault
						position={[0, cameraDistance * 0.7, cameraDistance * 0.5]}
						fov={60}
						near={1}
						far={5000}
					/>

					{/* Orbit controls for camera manipulation */}
					<OrbitControls
						enablePan={true}
						enableZoom={true}
						enableRotate={true}
						minDistance={20}
						maxDistance={cameraDistance * 5}
						maxPolarAngle={Math.PI / 2.1}
						minPolarAngle={0.1}
					/>

					{/* Lighting */}
					<ambientLight intensity={0.7} />
					<directionalLight
						position={[100, 200, 100]}
						intensity={0.5}
					/>
					<directionalLight
						position={[-100, 150, -100]}
						intensity={0.3}
					/>

					{/* Map scene */}
					<MapScene
						activeFloor={activeFloor}
						onRoomClick={setSelectedRoomId}
						route={isActive ? routeData?.route : undefined}
					/>
				</Suspense>
			</Canvas>

			<MapControls
				activeFloor={activeFloor}
				onChangeFloor={handleCenterOnFloor}
				zoomByStep={zoomByStep}
				rotation={rotation}
				resetRotation={resetRotation}
			/>

			<RoomModal
				roomId={selectedRoomId}
				onClose={() => setSelectedRoomId(null)}
			/>
			<RouteBuilderModal />
		</div>
	)
}
