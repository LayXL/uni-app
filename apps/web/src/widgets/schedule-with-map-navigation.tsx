"use client"

import { findRoomByClassroomName } from "@repo/shared/lessons/normalize-classroom-name"

import { useActiveFloor } from "@/features/map/hooks/use-active-floor"
import { useMapData } from "@/features/map/hooks/use-map-data"
import { useMapState } from "@/features/map/hooks/use-map-state"
import { ScheduleViewer } from "@/features/schedule/ui/schedule-viewer"
import { analytics } from "@/shared/lib/analytics"

export const ScheduleWithMapNavigation = () => {
	const mapData = useMapData()
	const { setActiveFloor } = useActiveFloor()
	const { moveTo, setZoom } = useMapState()

	const handleClassroomClick = (classroom: string) => {
		const room = findRoomByClassroomName(mapData.entities, classroom)

		if (room) {
			analytics.track("room_clicked", {
				room_id: room.id,
				room_name: room.name,
				floor_id: room.floorId,
				source: "schedule",
			})
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
