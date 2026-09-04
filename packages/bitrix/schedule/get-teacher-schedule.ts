import { getBitrixTextWithRecovery } from "../ky"
import { parseSchedule } from "./parser/parse-schedule"

export async function getTeacherSchedule(
	teacher: string,
	cookie: string,
	signal?: AbortSignal,
) {
	const body = await getBitrixTextWithRecovery(
		`mobile/teacher/schedule/teacher.php?id=${teacher}`,
		{
			signal,
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		},
	)

	return parseSchedule(body, "")
}
