import { env } from "@repo/env"

import { parseSchedule } from "./parser/parse-schedule"

export async function getSchedule(group: string, cookie: string) {
	const transformedGroup = group.split("(")[0]
	const url = `${env.bitrixUrl}mobile/teacher/schedule/spo_and_vo.php?name=${transformedGroup}`

	const response = await fetch(url, {
		headers: {
			Cookie: cookie,
			"Content-Type": "application/x-www-form-urlencoded",
		},
	})

	const body = await response.text()

	return parseSchedule(body, group)
}
