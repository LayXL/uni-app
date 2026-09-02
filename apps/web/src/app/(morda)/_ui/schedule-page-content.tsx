"use client"

import { useQueries } from "@tanstack/react-query"
import { Navigate } from "@tanstack/react-router"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { useUser } from "@/entities/user/hooks/useUser"
import { useScheduleGroup } from "@/features/schedule/hooks/use-schedule-group"
import { ScheduleHeader } from "@/features/schedule/ui/schedule-header"
import { ScheduleTimer } from "@/features/schedule/ui/schedule-timer"
import { useIsClient } from "@/shared/hooks/use-is-client"
import { SaveCurrentGroupAsUser } from "@/widgets/save-current-group-as-user"
import { ScheduleWithMapNavigation } from "@/widgets/schedule-with-map-navigation"

import { SettingsLink } from "./settings-button"

export const SchedulePageSkeleton = () => (
	<div role="status" aria-busy="true" aria-label="Загрузка расписания">
		<div className="flex h-16 items-center justify-between pl-4 pr-2">
			<h2 className="text-2xl font-semibold">Расписание</h2>
			<div className="h-10 min-w-26 animate-pulse rounded-3xl bg-card" />
		</div>
		<div className="flex animate-pulse flex-col gap-4 px-2">
			<div className="h-24 rounded-3xl bg-card" />
			<div className="h-40 rounded-3xl bg-card" />
			<div className="h-40 rounded-3xl bg-card" />
		</div>
	</div>
)

const SchedulePageView = () => (
	<>
		<ScheduleHeader action={<SettingsLink />} />
		<ScheduleTimer />
		<SaveCurrentGroupAsUser />
		<ScheduleWithMapNavigation />
	</>
)

const ScheduleData = ({ groupId }: { groupId: number }) => {
	const isClient = useIsClient()
	const dates = getNextTwoWeeksDates()
	const results = useQueries({
		queries: [
			{
				...orpc.groups.getAllGroups.queryOptions({}),
				enabled: isClient,
			},
			{
				...orpc.schedule.getTimetable.queryOptions(),
				enabled: isClient,
			},
			{
				...orpc.schedule.getSchedule.queryOptions({
					input: { dates, group: groupId },
				}),
				enabled: isClient,
			},
			{
				...orpc.events.getEvents.queryOptions({
					input: { dates, group: groupId },
				}),
				enabled: isClient,
			},
		],
	})
	const error = results.find((result) => result.error)?.error

	if (error) throw error
	if (!isClient || results.some((result) => result.isPending)) {
		return <SchedulePageSkeleton />
	}

	return <SchedulePageView />
}

export const SchedulePageContent = () => {
	const user = useUser()
	const { group } = useScheduleGroup()

	if (!user.group) return <Navigate to="/onboarding" replace />
	if (!group) return <SchedulePageSkeleton />

	return <ScheduleData groupId={group.id} />
}
