import { HTMLElement } from "node-html-parser"

import { normalizeClassroomName } from "@repo/shared/lessons/normalize-classroom-name"

export const parseLesson = (lesson: HTMLElement) => {
	// Count logical table columns: cancelled lessons merge subject and room.
	const cells = lesson.childNodes
		.filter(
			(child): child is HTMLElement =>
				child instanceof HTMLElement &&
				(child.tagName === "TD" || child.tagName === "TH"),
		)
		.flatMap((cell) =>
			Array.from(
				{ length: Number(cell.getAttribute("colspan")) || 1 },
				() => cell,
			),
		)
	const isTeacher = cells.length === 4
	const subjectCell = cells[isTeacher ? 2 : 1]
	const classroomCell = cells[isTeacher ? 3 : 2]
	const classroom = normalizeClassroomName(
		classroomCell?.innerText.trim() ?? "",
	)
	const subject = subjectCell?.innerText.replaceAll(/\s+/g, " ").trim() ?? ""

	return {
		order: Number(cells[0]?.innerText),
		subject,
		classroom,
		isCancelled: /отменено/i.test(classroom),
		isDistance: /дистант/i.test(classroom),
		isChanged: lesson.classNames.includes("table-danger"),
	}
}
