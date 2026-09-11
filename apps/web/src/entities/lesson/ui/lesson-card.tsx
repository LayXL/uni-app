"use client"

import { useState } from "react"

import { transformFullNameToInitials } from "@repo/shared/groups/transform-full-name-to-initials"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { ModalRoot } from "@/shared/ui/modal-root"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

import { formatLessonTime } from "../lib/format-lesson-time"
import { LessonModal } from "./lesson-modal"

type LessonCardProps = {
	group?: number
	lesson: Lesson
	isTeacherView?: boolean
	isActive?: boolean
	hideClassroom?: boolean
	showFullTeacherName?: boolean
	showParallelGroups?: boolean
	variant?: "card" | "row"
	onClassroomClick?: (classroomId: number) => void
}

const getGroupNoun = (count: number) => {
	const lastTwoDigits = count % 100

	if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "групп"
	if (count % 10 === 1) return "группа"
	if (count % 10 >= 2 && count % 10 <= 4) return "группы"

	return "групп"
}

const formatAdditionalGroups = (groups: string[]) => {
	if (groups.length <= 1) return groups.join("")
	if (groups.length === 2) return groups.join(" и ")

	return `ещё ${groups.length} ${getGroupNoun(groups.length)}`
}

export const LessonCard = ({
	lesson,
	group,
	isTeacherView,
	isActive,
	hideClassroom,
	showFullTeacherName = false,
	showParallelGroups = true,
	variant = "card",
	onClassroomClick,
}: LessonCardProps) => {
	const [isOpen, setIsOpen] = useState(false)

	const otherGroups = lesson.groups.filter(
		({ type, id }) => type === "studentsGroup" && id !== group,
	)
	const teachers = lesson.groups
		.filter(
			({ type, id }) => type === "teacher" && (!isTeacherView || id !== group),
		)
		.map((teacher) =>
			showFullTeacherName
				? transformToGroupName(teacher)
				: transformFullNameToInitials(transformToGroupName(teacher)),
		)
	const additionalGroups = otherGroups.map((group) =>
		transformToGroupName(group),
	)
	const additionalGroupsLabel = showParallelGroups
		? formatAdditionalGroups(additionalGroups)
		: ""

	return (
		<>
			<Touchable>
				<button
					type="button"
					className={cn(
						"relative flex w-full flex-col items-stretch gap-1 bg-card p-3 text-left",
						variant === "card"
							? "rounded-3xl"
							: "first:rounded-t-3xl last:rounded-b-3xl",
					)}
					onClick={() => setIsOpen(true)}
				>
					{variant === "card" && <LiquidBorder />}
					<div className="flex min-w-0 items-start gap-1 text-sm">
						<p className="shrink-0 text-muted">
							{formatLessonTime(lesson.startTime)} – {formatLessonTime(lesson.endTime)}
						</p>
						<span aria-hidden="true" className="text-muted">·</span>
						<p className="shrink-0 text-muted">{lesson.order} пара</p>
						{!hideClassroom && (
							<div className="ml-auto flex shrink-0 min-w-0 items-center gap-1 pl-2">
								<Icon name="place-12" className="shrink-0 text-muted" />
								<p
									className={cn(
										"min-w-0 truncate",
										lesson.isDistance && "text-accent",
									)}
								>
									{lesson.isDistance ? "дистант" : lesson.classroom}
								</p>
							</div>
						)}
					</div>
					<p
						className={cn(
							"line-clamp-2 break-words font-medium transition-colors",
							isActive && "text-accent",
						)}
					>
						{lesson.subject.name}
					</p>
					<p className="line-clamp-1 break-all text-[15px] text-muted">
						{teachers.join(", ")}
						{teachers.length > 0 && additionalGroupsLabel ? " + " : ""}
						{additionalGroupsLabel}
					</p>
				</button>
			</Touchable>
			<ModalRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
				<LessonModal
					lesson={lesson}
					group={group}
					onClassroomClick={(classroomId) => {
						onClassroomClick?.(classroomId)
						setIsOpen(false)
					}}
				/>
			</ModalRoot>
		</>
	)
}
