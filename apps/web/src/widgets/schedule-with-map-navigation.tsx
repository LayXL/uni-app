"use client"

import { useRouter } from "next/navigation"

import { ScheduleViewer } from "@/features/schedule/ui/schedule-viewer"

export const ScheduleWithMapNavigation = () => {
	const router = useRouter()

	const handleClassroomClick = (classroomId: number) => {
		router.push(`/map?room=${classroomId}`)
	}

	return <ScheduleViewer onClassroomClick={handleClassroomClick} />
}
