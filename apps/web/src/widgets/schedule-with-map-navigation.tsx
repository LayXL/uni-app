"use client"

import { useNavigate } from "@tanstack/react-router"

import { ScheduleViewer } from "@/features/schedule/ui/schedule-viewer"

export const ScheduleWithMapNavigation = () => {
	const navigate = useNavigate()

	const handleClassroomClick = (classroomId: number) => {
		void navigate({ to: "/map", search: { room: classroomId } })
	}

	return <ScheduleViewer onClassroomClick={handleClassroomClick} />
}
