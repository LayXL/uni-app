import type { Lesson } from "@repo/shared/lessons/types/lesson"

type RouteLesson = Pick<Lesson, "classroomId" | "isCancelled" | "isDistance">

export const getRouteSuggestions = (lessons: RouteLesson[]) => {
	const suggestions: { from: number; to: number }[] = []
	let previousRoom = 166

	for (const lesson of lessons) {
		const room = lesson.classroomId
		if (room === undefined || lesson.isCancelled || lesson.isDistance) continue

		if (previousRoom !== room) {
			suggestions.push({ from: previousRoom, to: room })
		}
		previousRoom = room
	}

	return suggestions
}
