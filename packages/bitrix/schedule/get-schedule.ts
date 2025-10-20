import { bitrix } from "../ky"
import { parseSchedule } from "./parser/parse-schedule"

export async function getSchedule(group: string, cookie: string) {
	const transformedGroup = group.split("(")[0]
	const body = await bitrix
		.get(`mobile/teacher/schedule/spo_and_vo.php?name=${transformedGroup}`, {
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		})
		.text()

	return parseSchedule(body, group)
}
