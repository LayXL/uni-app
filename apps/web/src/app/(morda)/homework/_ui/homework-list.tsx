"use client"

import { useSuspenseQuery } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"
import { isTestingGroupId } from "@repo/shared/testing-group"

import { HomeworkCard } from "@/entities/homework/ui/homework-card"
import { useUser } from "@/entities/user/hooks/useUser"
import { useScheduleGroup } from "@/features/schedule/hooks/use-schedule-group"
import { useLocalStorage } from "@/shared/hooks/use-local-storage"
import { LottiePlayer } from "@/shared/ui/lottie"
import { Toggle } from "@/shared/ui/toggle"

export function HomeworkList() {
	const user = useUser()
	const { group } = useScheduleGroup()
	const testingGroupId = isTestingGroupId(group?.id) ? group.id : undefined
	const { data: homeworks } = useSuspenseQuery(
		orpc.homeworks.getHomeworks.queryOptions(
			testingGroupId ? { input: { group: testingGroupId } } : {},
		),
	)
	const [onlyMine, setOnlyMine] = useLocalStorage("onlyMyHomeworks")

	const visibleHomeworks = onlyMine
		? homeworks.filter((hw) => hw.author === user.id)
		: homeworks

	return (
		<>
			<div className="flex items-center justify-between px-4 pb-1">
				<span className="text-sm text-muted">Только мои задания</span>
				<Toggle value={onlyMine} onChange={setOnlyMine} />
			</div>
			{visibleHomeworks.length === 0 ? (
				<div className="flex flex-col items-center gap-3 py-16 px-4">
					<LottiePlayer src="duck-thumb-up" className="w-40 h-40 self-center" />
					<p className="text-center">Домашних заданий нет</p>
				</div>
			) : (
				<div className="flex flex-col gap-2 px-4 pt-2">
					{visibleHomeworks.map((hw) => (
						<HomeworkCard
							key={hw.id}
							id={hw.id}
							title={hw.title}
							deadline={hw.deadline}
							subjectName={hw.subject?.name}
							isSharedWithWholeGroup={hw.isSharedWithWholeGroup}
							filesCount={(hw.files as unknown[]).length}
							isCompleted={hw.isCompleted}
						/>
					))}
				</div>
			)}
		</>
	)
}
