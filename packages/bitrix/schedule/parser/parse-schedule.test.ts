import { describe, expect, test } from "bun:test"

import { parseSchedule } from "./parse-schedule"

const card = (subject: string, classroom = "117", changed = false) => `
	<div class="card-body">
		<h5>04.09. Пятница</h5>
		<table><tbody>
			<tr${changed ? ' class="table-danger"' : ""}>
				<th>2</th><td>${subject}</td><td>${classroom}</td>
			</tr>
		</tbody></table>
	</div>
`

// Bitrix renders numbered subgroups without a subgroupNum_0 container.
const subgroupHtml = `
	<div id="withReplacements"><h4>Расписание с учётом замен</h4></div>
	<div class="subgroupContent" id="withReplacements_subgroupNum_1" style="display: none;"">
		${card("История России", "117", true)}
	</div>
	<div class="subgroupContent" id="withReplacements_subgroupNum_2" style="display: none;"">
		${card("Иностранный язык", "123")}
	</div>
	<div class="subgroupContent" id="withoutReplacements_subgroupNum_1">
		${card("История России", "118")}
	</div>
	<div class="subgroupContent" id="withoutReplacements_subgroupNum_2">
		${card("Иностранный язык", "123")}
	</div>
`

// School teachers have a weekly timetable without dates or replacement containers.
const schoolHtml = `
	<h4>Преподаватель Тестов Т.Т.</h4>
	<h4>Расписание школы</h4>
	<div class="row"><div class="col card-deck"><div class="card mb-3 bg-light">
		<div class="card-body">
			<h5 class="card-title">Понедельник</h5>
			<table class="table table-sm"><tbody>
				<tr><th>1</th><td>6б</td><td>История</td><td>212 МИДИС</td></tr>
			</tbody></table>
		</div>
	</div></div></div>
`

describe("parseSchedule", () => {
	test.each([
		["Тд-26(1)", "История России", "117"],
		["Тд-26(2)", "Иностранный язык", "123"],
	])("reads only the requested subgroup %s", async (group, subject, classroom) => {
		const lessons = await parseSchedule(subgroupHtml, group)

		expect(lessons).toHaveLength(1)
		expect(lessons[0]).toMatchObject({ subject, classroom, order: 2 })
		expect(lessons[0].date.endsWith("-09-04")).toBe(true)
	})

	test("compares replacements with the same subgroup", async () => {
		const [lesson] = await parseSchedule(subgroupHtml, "Тд-26(1)")

		expect(lesson).toMatchObject({
			isChanged: true,
			original: { classroom: "118" },
		})
	})

	test("supports an unsplit group with subgroup zero", async () => {
		const html = `
			<div id="withReplacements_subgroupNum_0"">${card("История России")}</div>
			<div id="withoutReplacements_subgroupNum_0">${card("История России")}</div>
		`

		expect(await parseSchedule(html, "Тд-27")).toHaveLength(1)
	})

	test("supports the teacher layout without subgroup containers", async () => {
		const teacherCard = `
			<div class="card-body"><h5>04.09. Пятница</h5><table><tbody>
				<tr><th>2</th><td>Тд-26</td><td>История России</td><td>117</td></tr>
			</tbody></table></div>
		`
		const html = `
			<div class="withReplacements">${teacherCard}</div>
			<div class="withoutReplacements">${teacherCard}</div>
		`

		expect(await parseSchedule(html, "")).toMatchObject([
			{ order: 2, subject: "История России", classroom: "117" },
		])
	})

	test("skips the undated school-only teacher timetable", async () => {
		expect(await parseSchedule(schoolHtml, "")).toEqual([])
	})

	test("still reads dated lessons when a teacher also has a school timetable", async () => {
		const html = `${schoolHtml}<div class="withReplacements">${card("История России")}</div>`

		expect(await parseSchedule(html, "")).toMatchObject([
			{ subject: "История России", order: 2 },
		])
	})

	test("does not accept a school timetable in place of a student group", async () => {
		await expect(parseSchedule(schoolHtml, "Тд-26")).rejects.toThrow("Тд-26")
	})

	test("rejects an unexpected teacher page", async () => {
		await expect(
			parseSchedule("<html><body>Авторизация</body></html>", ""),
		).rejects.toThrow("teacher")
	})

	test.each([
		"Тд-26",
		"Тд-26(3)",
	])("rejects missing subgroup %s instead of returning an empty schedule", async (group) => {
		await expect(parseSchedule(subgroupHtml, group)).rejects.toThrow(group)
	})

	test("rejects an unexpected page instead of clearing the schedule", async () => {
		await expect(
			parseSchedule("<html><body>Авторизация</body></html>", "Тд-26(1)"),
		).rejects.toThrow("Тд-26(1)")
	})

	test("accepts a recognized empty schedule", async () => {
		expect(
			await parseSchedule(
				'<div id="withReplacements_subgroupNum_0"></div>',
				"Тд-27",
			),
		).toEqual([])
	})

	test("reads lessons when the original schedule is missing", async () => {
		const html = `<div id="withReplacements_subgroupNum_0">${card("История России", "117", true)}</div>`

		expect(await parseSchedule(html, "Тд-27")).toMatchObject([
			{ subject: "История России", classroom: "117", isChanged: true },
		])
	})
})
