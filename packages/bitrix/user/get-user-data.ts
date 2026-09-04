import { bitrix } from "../ky"
import { parseUserData } from "./parse-user-data"

export async function getUserData(userId: number, cookie: string) {
	const response = await bitrix
		.get(`mobile/users/?user_id=${userId}`, {
			timeout: 30_000,
			retry: 1,
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		})
		.text()

	return parseUserData(response)
}
