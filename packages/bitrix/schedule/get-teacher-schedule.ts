import { env } from "@repo/env"

import { parseSchedule } from "./parser/parse-schedule"

export async function getTeacherSchedule(teacher: string, cookie: string) {
	const url = `${env.bitrixUrl}mobile/teacher/schedule/teacher.php?id=${teacher}`

	const response = await fetch(url, {
		headers: {
			Cookie: cookie,
			"Content-Type": "application/x-www-form-urlencoded",
		},
	})

	const body = await response.text()

	return parseSchedule(body, "")
}
