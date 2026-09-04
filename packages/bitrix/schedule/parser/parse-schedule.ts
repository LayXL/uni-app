import { format } from "date-fns/format"
import { parse as parseDate } from "date-fns/parse"
import parseHtml from "node-html-parser"

import { formatScheduleHtml } from "./format-schedule-html"
import { getDifferences } from "./get-differences"
import { parseLesson } from "./parse-lesson"

export const parseSchedule = async (html: string, groupName: string) => {
	const root = parseHtml(await formatScheduleHtml(html))

	const subgroup = groupName.split("(")?.[1]?.split(")")?.[0] ?? 0

	// Numbered subgroups may have no subgroupNum_0 container at all.
	const hasSubgroupContainers = Boolean(
		root.querySelector(
			'[id^="withReplacements_subgroupNum_"], [id^="withoutReplacements_subgroupNum_"]',
		),
	)

	const scheduleSelector = hasSubgroupContainers
		? `#withReplacements_subgroupNum_${subgroup}`
		: ".withReplacements"
	const originalSelector = hasSubgroupContainers
		? `#withoutReplacements_subgroupNum_${subgroup}`
		: ".withoutReplacements"

	if (!root.querySelector(scheduleSelector)) {
		// School-only teachers have an undated weekly timetable, not dated lessons.
		const isSchoolTeacher =
			!groupName &&
			!hasSubgroupContainers &&
			root
				.querySelectorAll("h4")
				.some((heading) => heading.innerText.trim() === "Расписание школы")

		if (isSchoolTeacher) return []

		throw new Error(
			`Schedule container ${scheduleSelector} not found for ${groupName || "teacher"}`,
		)
	}

	const cards = root.querySelectorAll(`${scheduleSelector} .card-body`)
	const originalCards = root.querySelectorAll(`${originalSelector} .card-body`)

	let i = 0

	const output: ({
		date: string
		original?: Partial<ReturnType<typeof parseLesson>>
	} & ReturnType<typeof parseLesson>)[] = []

	for (const card of cards) {
		const day = card
			.querySelector("h5")
			?.innerText.split(".")
			.slice(0, 2)
			.join(".")
			.trim()

		if (!day) continue

		const date = format(parseDate(day, "dd.MM", new Date()), "yyyy-MM-dd")

		const lessons = card.querySelectorAll("tbody>tr")

		let j = 0

		for (const lesson of lessons) {
			const originalLesson = originalCards[i]?.querySelectorAll("tbody>tr")[j]

			const parsedLesson = parseLesson(lesson)

			const { isChanged: _, ...originalParsedLesson } = originalLesson
				? parseLesson(originalLesson)
				: { isChanged: false }

			output.push({
				date,
				...parsedLesson,
				...(parsedLesson.isChanged
					? { original: getDifferences(parsedLesson, originalParsedLesson) }
					: {}),
			})

			j++
		}

		i++
	}

	return output
}
