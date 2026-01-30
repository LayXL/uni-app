import { HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { orpc } from "@repo/orpc/react"
import { getTeacherGender } from "@repo/shared/groups/get-teacher-gender"
import { inclineTeacherName } from "@repo/shared/groups/incline-teacher-name"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { ScheduleViewerWithGroup } from "@/features/schedule/ui/schedule-viewer"
import { Fetcher } from "@/shared/utils/fetcher"

type SchedulePageProps = {
	params: Promise<{ groupId: string }>
}

export default async function SchedulePage({ params }: SchedulePageProps) {
	const { groupId } = await params
	const fetcher = new Fetcher()

	const group = await fetcher.fetch(orpc.groups.getGroup, {
		id: Number(groupId),
	})

	if (!group) {
		return notFound()
	}

	await fetcher.fetch(orpc.schedule.getSchedule, {
		dates: getNextTwoWeeksDates(),
		group: Number(groupId),
	})

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<div className="flex flex-col gap-4 pt-[calc(var(--safe-area-inset-top)+1rem)]">
				<h2 className="px-4 py-2 text-lg font-semibold">
					Расписание{" "}
					{group.type === "teacher"
						? `${getTeacherGender(group) === "female" ? "преподавательницы" : "преподавателя"} ${inclineTeacherName(group, "genitive")}`
						: `группы ${transformToGroupName(group)}`}
				</h2>
				<ScheduleViewerWithGroup
					group={Number(groupId)}
					isTeacherView={group.type === "teacher"}
				/>
			</div>
		</HydrationBoundary>
	)
}
