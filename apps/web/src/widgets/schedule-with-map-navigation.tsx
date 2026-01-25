"use client"

import { isRoom } from "@repo/shared/building-scheme"

import { useActiveFloor } from "@/features/map/hooks/use-active-floor"
import { useMapData } from "@/features/map/hooks/use-map-data"
import { useMapState } from "@/features/map/hooks/use-map-state"
import { ScheduleViewer } from "@/features/schedule/ui/schedule-viewer"

export const ScheduleWithMapNavigation = () => {
	const mapData = useMapData()
	const { setActiveFloor } = useActiveFloor()
	const { moveTo, setZoom } = useMapState()

	const handleClassroomClick = (classroom: string) => {
		const room = mapData.entities.find((e) => isRoom(e) && e.name === classroom)

		if (room && isRoom(room)) {
			window.scrollTo({ top: 0, behavior: "smooth" })
			setActiveFloor(room.floorId)
			setZoom(0.5)

			if (room.wallsPosition.length > 0) {
				const xs = room.wallsPosition.map((p) => p.x)
				const ys = room.wallsPosition.map((p) => p.y)
				const centerX = (Math.min(...xs) + Math.max(...xs)) / 2
				const centerY = (Math.min(...ys) + Math.max(...ys)) / 2

				moveTo(room.position.x + centerX, room.position.y + centerY)
			} else {
				moveTo(room.position.x, room.position.y)
			}
		}
	}

	return <ScheduleViewer onClassroomClick={handleClassroomClick} />
}
