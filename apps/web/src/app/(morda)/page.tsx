import Link from "next/link"

import { client } from "@repo/orpc/client"

import { fetch } from "@/shared/utils/fetch"

export default async function () {
	const user = await fetch(client.users.me, undefined)

	return (
		<div>
			<p>Hello there, {user.telegramId}</p>
			<p>Group: {user.group?.displayName}</p>
			<Link href="/onboarding">Onboarding</Link>
		</div>
	)
}
