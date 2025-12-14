import { addDays } from "date-fns"
import Link from "next/link"

import { client } from "@repo/orpc/client"

import { fetch } from "@/shared/utils/fetch"

export default async function () {
	const user = await fetch(client.users.me, undefined)

	const schedule = user.group
		? await fetch(client.schedule.getSchedule, {
				date: Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
				group: user.group?.id,
			})
		: null

	console.log(schedule)

	return (
		<div>
			<p>Hello there, {user.telegramId}</p>
			<p>Group: {user.group?.displayName}</p>
			<Link href="/onboarding">Onboarding</Link>

			<div className="flex flex-col gap-2 p-4">
				{schedule?.map((lesson, i) => (
					<div
						key={i}
						className="flex flex-col gap-2 bg-secondary p-3 rounded-2xl border border-border"
					>
						<p>{lesson.subject.name}</p>
						<p>{lesson.classroom}</p>
						<p>
							{lesson.groups
								.filter((group) => group.id !== user.group?.id)
								.map((group) =>
									group.type === "studentsGroup"
										? group.displayName
										: group.displayName.split("(")[0],
								)
								.join(", ")}
						</p>
					</div>
				))}
			</div>
		</div>
	)
}
