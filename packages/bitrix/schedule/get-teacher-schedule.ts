import { bitrix } from "../ky"
import { parseSchedule } from "./parser/parse-schedule"

export async function getTeacherSchedule(teacher: string, cookie: string) {
	const body = await bitrix
		.get(`mobile/teacher/schedule/teacher.php?id=${teacher}`, {
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		})
		.text()

	return parseSchedule(body, "")
}
