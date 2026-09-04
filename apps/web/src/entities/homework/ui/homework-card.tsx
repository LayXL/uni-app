"use client"

import { Link } from "@tanstack/react-router"
import { addDays, format, isBefore, isSameDay } from "date-fns"
import { ru } from "date-fns/locale"

import { useHomeworkCompletion } from "@/entities/homework/hooks/use-homework-completion"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import { getClientTestNow } from "@/shared/utils/test-time"

function formatDeadline(deadline: Date | string) {
	const d = new Date(deadline)
	const now = getClientTestNow()

	if (isSameDay(d, now)) return "Сегодня"
	if (isSameDay(d, addDays(now, 1))) return "Завтра"
	return format(d, "d MMMM", { locale: ru })
}

type Urgency = "overdue" | "urgent" | "soon" | "normal"

function getUrgency(deadline: Date | string): Urgency {
	const d = new Date(deadline)
	const now = getClientTestNow()
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
	description: string
	deadline: Date | string
	subjectName?: string | null
	authorName?: string | null
	isSharedWithWholeGroup: boolean
	filesCount: number
	isCompleted: boolean
}

export function HomeworkCard({
	id,
	title,
	description,
	deadline,
	subjectName,
	authorName,
	isSharedWithWholeGroup,
	filesCount,
	isCompleted: initialCompleted,
}: HomeworkCardProps) {
	const { isCompleted, isPending, toggle } = useHomeworkCompletion(
		id,
		initialCompleted,
	)
	const urgency = getUrgency(deadline)
	const hasBadges = subjectName || isSharedWithWholeGroup || filesCount > 0

	const handleToggle = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		toggle()
	}

	return (
		<Touchable>
			<Link
				to="/homework/$id"
				params={{ id }}
				className={cn(
					"relative bg-card rounded-3xl p-4 flex flex-col gap-2",
					isCompleted && "opacity-60",
				)}
			>
				<LiquidBorder />
				<div className="flex items-center gap-3 min-w-0">
					<Touchable>
						<button
							type="button"
							onClick={handleToggle}
							disabled={isPending}
							aria-label={
								isCompleted ? "Отметить невыполненным" : "Отметить выполненным"
							}
							aria-pressed={isCompleted}
							className="shrink-0 disabled:cursor-wait"
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
					<span
						className={cn(
							"font-medium truncate flex-1 min-w-0",
							isCompleted && "line-through",
						)}
					>
						{title}
					</span>
					<span className={cn("text-sm shrink-0", urgencyClass[urgency])}>
						{formatDeadline(deadline)}
					</span>
				</div>
				{description && (
					<p className="line-clamp-2 whitespace-pre-wrap wrap-anywhere text-sm leading-5 text-muted">
						{description}
					</p>
				)}
				{hasBadges && (
					<div className="flex items-center gap-2 flex-wrap">
						{subjectName && (
							<span className="text-xs text-muted">{subjectName}</span>
						)}
						{isSharedWithWholeGroup && (
							<span className="text-xs bg-background rounded-full px-2 py-0.5 flex items-center gap-1">
								<Icon
									name="iconify:material-symbols:group"
									size={12}
									className="shrink-0"
								/>
								<span className="min-w-0 wrap-anywhere">
									{authorName?.trim() || "Автор"} поделился с группой
								</span>
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
			</Link>
		</Touchable>
	)
}
