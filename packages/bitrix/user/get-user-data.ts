import parse from "node-html-parser"

import { bitrix } from "../ky"

export async function getUserData(userId: number, cookie: string) {
	const response = await bitrix
		.get(`mobile/users/?user_id=${userId}`, {
			headers: {
				Cookie: cookie,
				"Content-Type": "application/x-www-form-urlencoded",
			},
		})
		.text()

	const root = parse(response)

	const name = root.querySelector(".emp-profile-name")?.innerText

	return {
		name,
	}
}
