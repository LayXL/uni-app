import type { Lesson } from "@repo/shared/lessons/types/lesson"

export const mergeConsecutiveLessons = (lessons: Lesson[]): Lesson[][] => {
	const result: Lesson[][] = []
	for (const lesson of lessons) {
		const previousGroup = result.at(-1)
		const previous = previousGroup?.at(-1)
		const teachers = lesson.groups.filter(({ type }) => type === "teacher")
		const previousTeachers =
			previous?.groups.filter(({ type }) => type === "teacher") ?? []
		if (
			previous &&
			previousGroup &&
			previous.date === lesson.date &&
			previous.order + 1 === lesson.order &&
			previous.subject.id === lesson.subject.id &&
			previous.classroom === lesson.classroom &&
			previous.classroomId === lesson.classroomId &&
			previous.isDistance === lesson.isDistance &&
			previous.isCancelled === lesson.isCancelled &&
			teachers.length > 0 &&
			teachers.length === previousTeachers.length &&
			teachers.every(({ id }) =>
				previousTeachers.some((teacher) => teacher.id === id),
			)
		) {
			previousGroup.push(lesson)
		} else {
			result.push([lesson])
		}
	}
	return result
}
