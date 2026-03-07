"use client"

import { useSuspenseQuery } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

import { HomeworkCard } from "@/entities/homework/ui/homework-card"
import { Icon } from "@/shared/ui/icon"

export function HomeworkList() {
	const { data: homeworks } = useSuspenseQuery(
		orpc.homeworks.getHomeworks.queryOptions({}),
	)

	if (homeworks.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-muted px-4">
				<Icon
					name="iconify:material-symbols:check-circle-outline"
					size={48}
					className="opacity-40"
				/>
				<p className="text-center text-sm">Домашних заданий нет</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-2 px-4 pt-2">
			{homeworks.map((hw) => (
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
	)
}
