"use client"

import { useQuery } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { ScheduleViewerWithGroup } from "@/features/schedule/ui/schedule-viewer"
import { TeacherScheduleProfile } from "@/features/schedule/ui/teacher-schedule-profile"
import { useIsClient } from "@/shared/hooks/use-is-client"
import { BackButton } from "@/shared/ui/back-button"
import { PageTitle } from "@/shared/ui/page-title"
import { isVK } from "@/shared/utils/is-vk"

type ScheduleGroup = {
	id: number
	displayName: string
	type: "teacher" | "studentsGroup"
	avatarUrl: string | null
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
	return (
		<div className="flex flex-col pt-[calc(var(--safe-area-inset-top)+1rem)]">
			{group.type === "teacher" ? (
				<>
					{isVK() && (
						<div className="px-4">
							<BackButton />
						</div>
					)}
					<TeacherScheduleProfile
						displayName={group.displayName}
						avatarUrl={group.avatarUrl}
					/>
					<h2 className="px-4 mb-4 text-xl font-bold">Расписание</h2>
				</>
			) : (
				<>
					<div className="px-4">
						<PageTitle title="Расписание" />
					</div>
					<p className="text-sm px-4 mb-4">
						Группы {transformToGroupName(group)}
					</p>
				</>
			)}
			<ScheduleViewerWithGroup
				group={group.id}
				isTeacherView={group.type === "teacher"}
			/>
		</div>
	)
}

export const GroupSchedulePageContent = ({
	groupIdParam,
}: {
	groupIdParam: string
}) => {
	const isClient = useIsClient()
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
