import { expect, test } from "bun:test"
import parseHtml from "node-html-parser"

import { parseLesson } from "./parse-lesson"
import { parseSchedule } from "./parse-schedule"

const teacherOriginal =
	"<tr><th>6</th><td>БИ-312</td><td>Разработка и управление продуктом на основе пользовательского опыта</td><td>110</td></tr>"
const teacherCancelled =
	'<tr class="table-danger"><th>6</th><td>БИ-312</td><td colspan="2"><b>Занятие отменено</b></td></tr>'
const card = (row: string) =>
	`<div class="card-body"><h5>05.09. Суббота</h5><table><tbody>${row}</tbody></table></div>`

test("teacher columns do not depend on whitespace nodes", () => {
	for (const html of [
		teacherOriginal,
		teacherOriginal.replaceAll("><", ">\n  <"),
	]) {
		const row = parseHtml(html).querySelector("tr")
		if (!row) throw new Error("Missing fixture row")
		const lesson = parseLesson(row)
		expect(lesson.subject).toBe(
			"Разработка и управление продуктом на основе пользовательского опыта",
		)
		expect(lesson.classroom).toBe("110")
	}
})

test("cancelled teacher lesson retains the subject instead of the group code", async () => {
	const lessons = await parseSchedule(
		`<div class="withReplacements">${card(teacherCancelled)}</div><div class="withoutReplacements">${card(teacherOriginal)}</div>`,
		"",
	)
	expect(lessons).toHaveLength(1)
	expect(lessons[0]).toMatchObject({
		order: 6,
		subject:
			"Разработка и управление продуктом на основе пользовательского опыта",
		isCancelled: true,
		isChanged: true,
		original: { classroom: "110", isCancelled: false },
	})
})

test("student cancellation also restores the original subject", async () => {
	const original = "<tr><th>2</th><td>Типографика</td><td>321</td></tr>"
	const cancelled =
		'<tr class="table-danger"><th>2</th><td colspan="2">Занятие отменено</td></tr>'
	const lessons = await parseSchedule(
		`<div class="withReplacements">${card(cancelled)}</div><div class="withoutReplacements">${card(original)}</div>`,
		"",
	)
	expect(lessons[0]).toMatchObject({
		order: 2,
		subject: "Типографика",
		isCancelled: true,
	})
})

test("missing original card does not crash cancelled lesson parsing", async () => {
	const lessons = await parseSchedule(
		`<div class="withReplacements">${card(teacherCancelled)}</div>`,
		"",
	)
	expect(lessons[0].isCancelled).toBe(true)
	expect(lessons[0].subject).not.toBe("БИ-312")
})
