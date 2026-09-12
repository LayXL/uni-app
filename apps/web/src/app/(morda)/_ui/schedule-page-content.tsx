"use client"

import { useQueries } from "@tanstack/react-query"
import { Navigate } from "@tanstack/react-router"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"

import { GroupSelectionStep } from "@/entities/group/ui/group-selection-step"
import { useUser } from "@/entities/user/hooks/useUser"
import { useInitializeScheduleSplash } from "@/features/schedule/hooks/use-initialize-schedule-splash"
import { useScheduleGroup } from "@/features/schedule/hooks/use-schedule-group"
import { useScheduleSplash } from "@/features/schedule/hooks/use-schedule-splash"
import { cardSettingsQueryOptions } from "@/features/schedule/model/card-settings"
import { ScheduleHeader } from "@/features/schedule/ui/schedule-header"
import { ScheduleTimer } from "@/features/schedule/ui/schedule-timer"
import { ScheduleTitle } from "@/features/schedule/ui/schedule-title"
import { useIsClient } from "@/shared/hooks/use-is-client"
import { PageSkeleton } from "@/shared/ui/page-skeleton"
import { SaveCurrentGroupAsUser } from "@/widgets/save-current-group-as-user"
import { ScheduleWithMapNavigation } from "@/widgets/schedule-with-map-navigation"

import { SettingsLink } from "./settings-button"

export const SchedulePageSkeleton = () => {
	const title = useScheduleSplash()
	return (
		<PageSkeleton
			title={title ? <ScheduleTitle /> : undefined}
			label="Загрузка расписания"
		/>
	)
}

const SchedulePageView = () => (
	<>
		<ScheduleHeader action={<SettingsLink />} />
		<ScheduleTimer />
		<SaveCurrentGroupAsUser />
		<ScheduleWithMapNavigation />
	</>
)

const ScheduleData = ({ groupId }: { groupId: number }) => {
	const user = useUser()
	const isClient = useIsClient()
	const dates = getNextTwoWeeksDates()
	const results = useQueries({
		queries: [
			{
				...cardSettingsQueryOptions(user.id),
				enabled: isClient,
			},
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
	useInitializeScheduleSplash(user.group)

	if (!user.group) {
		return user.isGuest ? (
			<div className="p-4">
				<div className="flex justify-end">
					<SettingsLink />
				</div>
				<GroupSelectionStep source="schedule_search" />
			</div>
		) : (
			<Navigate to="/onboarding" replace />
		)
	}
	if (!group) return <SchedulePageSkeleton />

	return <ScheduleData groupId={group.id} />
}
