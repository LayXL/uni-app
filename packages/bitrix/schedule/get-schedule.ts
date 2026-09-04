import { getBitrixTextWithRecovery } from "../ky"
import { parseSchedule } from "./parser/parse-schedule"

export async function getSchedule(
	group: string,
	cookie: string,
	signal?: AbortSignal,
) {
	const transformedGroup = group.split("(")[0]
	const body = await getBitrixTextWithRecovery(
		`mobile/teacher/schedule/spo_and_vo.php?name=${transformedGroup}`,
		{
			signal,
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		},
	)

	return parseSchedule(body, group)
}
