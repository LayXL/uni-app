import type { Lesson } from "@repo/shared/lessons/types/lesson"

type OriginalLesson = {
	classroom?: string
	isCancelled?: boolean
	isDistance?: boolean
	subject?: string
}

const getOriginalLesson = (original: Lesson["original"]): OriginalLesson => {
	if (!original || typeof original !== "object" || Array.isArray(original)) {
		return {}
	}

	const value = original as Record<string, unknown>

	return {
		...(typeof value.classroom === "string"
			? { classroom: value.classroom }
			: {}),
		...(typeof value.isCancelled === "boolean"
			? { isCancelled: value.isCancelled }
			: {}),
		...(typeof value.isDistance === "boolean"
			? { isDistance: value.isDistance }
			: {}),
		...(typeof value.subject === "string" ? { subject: value.subject } : {}),
	}
}

const getLessonChangeMessages = (lesson: Lesson) => {
	if (!lesson.isChanged) return []

	const original = getOriginalLesson(lesson.original)
	const messages: string[] = []

	if (lesson.isCancelled) {
		return [`${lesson.order} пара отменена`]
	}

	if (original.subject && original.subject !== lesson.subject.name) {
		messages.push(
			`Вместо «${original.subject}» будет «${lesson.subject.name}» ${lesson.order} парой`,
		)
	}

	if (lesson.isDistance) {
		messages.push(`${lesson.order} пара пройдёт дистанционно`)
		return messages
	}

	if (original.isDistance) {
		messages.push(
			`${lesson.order} пара пройдёт очно в кабинете ${lesson.classroom}`,
		)
		return messages
	}

	if (original.classroom && original.classroom !== lesson.classroom) {
		messages.push(
			`У ${lesson.order} пары поменялся кабинет с ${original.classroom} на ${lesson.classroom}`,
		)
	}

	return messages
}

export const getScheduleChangeMessages = (lessons: Lesson[]) =>
	lessons.flatMap(getLessonChangeMessages)
