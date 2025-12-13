import { cookies } from "next/headers"

import { client } from "@repo/orpc/client"

export default async function () {
	const cookiesMap = await cookies()

	const headers = new Headers()

	headers.set("authorization", cookiesMap.get("session")?.value ?? "")

	const user = await client.users.me(undefined, {
		context: { headers },
	})

	return <div>Hello there, {user.name}</div>
}
