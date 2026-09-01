"use client"

import { useState } from "react"

import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"
import { cutSubjectName } from "@repo/shared/subjects/cut-subject-name"

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
		.map((teacher) => transformToGroupName(teacher))
	const additionalGroups = otherGroups.map((group) =>
		transformToGroupName(group),
	)
	const additionalGroupsLabel = formatAdditionalGroups(additionalGroups)

	return (
		<>
			<Touchable>
				<button
					type="button"
					className={cn(
						"relative flex w-full flex-col items-stretch gap-1 rounded-3xl bg-card p-3 text-left ring-2 ring-transparent transition-shadow",
						isActive && "ring-accent",
					)}
					onClick={() => setIsOpen(true)}
				>
					<LiquidBorder />
					<div className="flex min-w-0 items-center gap-1 text-sm tabular-nums">
						<p className="shrink-0">{lesson.order} пара</p>
						<p className="shrink-0">с</p>
						<p className="shrink-0">{formatLessonTime(lesson.startTime)}</p>
						<p className="shrink-0">до</p>
						<p className="shrink-0">{formatLessonTime(lesson.endTime)}</p>
						{!hideClassroom && (
							<div className="ml-auto flex min-w-0 items-center gap-1 pl-2">
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
					<p className="line-clamp-1 break-all font-medium">
						{cutSubjectName(lesson.subject.name)}
					</p>
					<p className="line-clamp-1 break-all text-sm text-muted">
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
