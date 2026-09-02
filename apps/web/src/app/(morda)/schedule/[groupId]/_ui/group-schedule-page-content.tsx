"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { orpc } from "@repo/orpc/react"
import { getTeacherGender } from "@repo/shared/groups/get-teacher-gender"
import { inclineTeacherName } from "@repo/shared/groups/incline-teacher-name"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { ScheduleViewerWithGroup } from "@/features/schedule/ui/schedule-viewer"
import { useIsClient } from "@/shared/hooks/use-is-client"
import { PageTitle } from "@/shared/ui/page-title"

type ScheduleGroup = {
	id: number
	displayName: string
	type: "teacher" | "studentsGroup"
}

export const GroupScheduleSkeleton = () => (
	<div
		role="status"
		aria-busy="true"
		aria-label="Загрузка расписания группы"
		className="flex animate-pulse flex-col gap-4 px-4 pt-[calc(var(--safe-area-inset-top)+1rem)]"
	>
		<div className="h-8 w-40 rounded-xl bg-card" />
		<div className="h-5 w-56 rounded-lg bg-card" />
		<div className="h-32 rounded-3xl bg-card" />
		<div className="h-32 rounded-3xl bg-card" />
	</div>
)

const GroupScheduleView = ({ group }: { group: ScheduleGroup }) => {
	const title =
		group.type === "teacher"
			? `${getTeacherGender(group) === "female" ? "Преподавательницы" : "Преподавателя"} ${inclineTeacherName(group, "genitive")}`
			: `Группы ${transformToGroupName(group)}`

	return (
		<div className="flex flex-col pt-[calc(var(--safe-area-inset-top)+1rem)]">
			<div className="px-4">
				<PageTitle title="Расписание" />
			</div>
			<p className="text-sm px-4 mb-4">{title}</p>
			<ScheduleViewerWithGroup
				group={group.id}
				isTeacherView={group.type === "teacher"}
			/>
		</div>
	)
}

export const GroupSchedulePageContent = () => {
	const isClient = useIsClient()
	const { groupId: groupIdParam } = useParams<{ groupId: string }>()
	const groupId = Number(groupIdParam)
	const isValidGroupId = Number.isInteger(groupId)
	const dates = getNextTwoWeeksDates()
	const groupQuery = useQuery({
		...orpc.groups.getGroup.queryOptions({ input: { id: groupId } }),
		enabled: isClient && isValidGroupId,
	})
	const scheduleQuery = useQuery({
		...orpc.schedule.getSchedule.queryOptions({
			input: { dates, group: groupId },
		}),
		enabled: isClient && isValidGroupId,
	})
	const eventsQuery = useQuery({
		...orpc.events.getEvents.queryOptions({
			input: { dates, group: groupId },
		}),
		enabled: isClient && isValidGroupId,
	})
	const error = groupQuery.error ?? scheduleQuery.error ?? eventsQuery.error

	if (!isValidGroupId) throw new Error("Invalid schedule group id")
	if (error) throw error
	if (
		!isClient ||
		groupQuery.isPending ||
		scheduleQuery.isPending ||
		eventsQuery.isPending ||
		!groupQuery.data
	) {
		return <GroupScheduleSkeleton />
	}

	return <GroupScheduleView group={groupQuery.data} />
}
