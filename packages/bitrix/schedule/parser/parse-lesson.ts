import type { HTMLElement } from "node-html-parser"

export const parseLesson = (lesson: HTMLElement) => {
	const colsCount = lesson.childNodes.length
	const isTeacher = colsCount === 9

	const classroom =
		lesson
			.querySelector(`td:nth-child(${isTeacher ? 4 : 3})`)
			?.innerText.trim() ?? ""

	const subject =
		lesson
			.querySelector(`td:nth-child(${isTeacher ? 3 : 2})`)
			?.innerText.replaceAll(/\s{2,}/g, " ")
			.trim() ?? ""

	return {
		order: Number(lesson.querySelector("th:nth-child(1)")?.innerText),
		subject,
		classroom,
		isCancelled: Boolean(classroom?.includes("отменено")),
		isDistance: Boolean(classroom?.includes("дистант")),
		isChanged: lesson.classNames.includes("table-danger"),
	}
}
