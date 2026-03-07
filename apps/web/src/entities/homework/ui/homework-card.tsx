"use client"

import { useQueryClient } from "@tanstack/react-query"
import { format, isBefore, isToday, isTomorrow } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

function formatDeadline(deadline: Date | string) {
	const d = new Date(deadline)
	if (isToday(d)) return "Сегодня"
	if (isTomorrow(d)) return "Завтра"
	return format(d, "d MMMM", { locale: ru })
}

type Urgency = "overdue" | "urgent" | "soon" | "normal"

function getUrgency(deadline: Date | string): Urgency {
	const d = new Date(deadline)
	const now = new Date()
	const daysLeft = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
	if (isBefore(d, now)) return "overdue"
	if (daysLeft <= 1) return "urgent"
	if (daysLeft <= 3) return "soon"
	return "normal"
}

const urgencyClass: Record<Urgency, string> = {
	overdue: "text-destructive",
	urgent: "text-destructive",
	soon: "text-accent",
	normal: "text-muted",
}

type HomeworkCardProps = {
	id: string
	title: string
	deadline: Date | string
	subjectName?: string | null
	isSharedWithWholeGroup: boolean
	filesCount: number
	isCompleted: boolean
}

export function HomeworkCard({
	id,
	title,
	deadline,
	subjectName,
	isSharedWithWholeGroup,
	filesCount,
	isCompleted: initialCompleted,
}: HomeworkCardProps) {
	const queryClient = useQueryClient()
	const [isCompleted, setIsCompleted] = useState(initialCompleted)
	const urgency = getUrgency(deadline)
	const hasBadges = subjectName || isSharedWithWholeGroup || filesCount > 0

	const handleToggle = async (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		const next = !isCompleted
		setIsCompleted(next)
		try {
			await orpc.homeworks.toggleCompletion.call({
				homeworkId: id,
				completed: next,
			})
			queryClient.invalidateQueries({
				queryKey: orpc.homeworks.getHomeworks.queryKey(),
			})
		} catch {
			setIsCompleted(!next)
		}
	}

	return (
		<Touchable>
			<Link
				href={`/homework/${id}`}
				className={cn(
					"relative bg-card rounded-3xl p-4 flex gap-3 items-start",
					isCompleted && "opacity-60",
				)}
			>
				<LiquidBorder />
				<Touchable>
					<button
						type="button"
						onClick={handleToggle}
						className="mt-0.5 shrink-0"
					>
						<Icon
							name={
								isCompleted
									? "iconify:material-symbols:check-circle"
									: "iconify:material-symbols:circle-outline"
							}
							size={22}
							className={isCompleted ? "text-accent" : "text-muted"}
						/>
					</button>
				</Touchable>
				<div className="flex flex-col gap-2 flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<span
							className={cn(
								"font-medium line-clamp-2 flex-1",
								isCompleted && "line-through",
							)}
						>
							{title}
						</span>
						<span className={cn("text-sm shrink-0", urgencyClass[urgency])}>
							{formatDeadline(deadline)}
						</span>
					</div>
					{hasBadges && (
						<div className="flex items-center gap-2 flex-wrap">
							{subjectName && (
								<span className="text-xs text-muted bg-background rounded-full px-2 py-0.5">
									{subjectName}
								</span>
							)}
							{isSharedWithWholeGroup && (
								<span className="text-xs bg-background rounded-full px-2 py-0.5 flex items-center gap-1">
									<Icon name="iconify:material-symbols:group" size={12} />
									Группа
								</span>
							)}
							{filesCount > 0 && (
								<span className="text-xs text-muted flex items-center gap-1">
									<Icon name="iconify:material-symbols:attach-file" size={12} />
									{filesCount}
								</span>
							)}
						</div>
					)}
				</div>
			</Link>
		</Touchable>
	)
}
