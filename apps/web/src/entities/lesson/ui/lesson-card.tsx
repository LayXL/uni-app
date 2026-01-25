"use client"

import { useState } from "react"

import { transformFullNameToInitials } from "@repo/shared/groups/transform-full-name-to-initials"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"
import { cutSubjectName } from "@repo/shared/subjects/cut-subject-name"

import { LiquidBorder } from "@/shared/ui/liquid-border"
import { ModalRoot } from "@/shared/ui/modal-root"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

import { LessonModal } from "./lesson-modal"

type LessonCardProps = {
	group?: number
	lesson: Lesson
	isTeacherView?: boolean
	onClassroomClick?: (classroom: string) => void
}

export const LessonCard = ({
	lesson,
	group,
	isTeacherView,
	onClassroomClick,
}: LessonCardProps) => {
	const [isOpen, setIsOpen] = useState(false)

	const otherGroups = lesson.groups.filter(
		({ type, id }) => type === "studentsGroup" && id !== group,
	)

	return (
		<>
			<Touchable>
				<button
					type="button"
					className="relative bg-card px-2 py-2 rounded-3xl flex items-center gap-2"
					onClick={() => setIsOpen(true)}
				>
					<LiquidBorder />
					<p className="font-medium tabular-nums">{lesson.order}</p>
					<div className="w-px self-stretch bg-border" />
					<div className="flex flex-col tabular-nums">
						<p>{lesson.startTime}</p>
						<p>{lesson.endTime}</p>
					</div>
					<div className="w-px self-stretch bg-border" />
					<div className="flex flex-col gap-1">
						<p className="font-medium line-clamp-1 break-all">
							{cutSubjectName(lesson.subject.name)}
						</p>
						<div className="flex gap-1 text-muted text-sm">
							<p
								className={cn("min-w-max", lesson.isDistance && "text-accent")}
							>
								{lesson.isDistance ? "дистант" : `${lesson.classroom} ауд`}
							</p>
							{!isTeacherView && (
								<p className="min-w-max">
									{lesson.groups
										.filter((group) => group.type === "teacher")
										.map((group) =>
											transformFullNameToInitials(transformToGroupName(group)),
										)
										.join(", ")}
								</p>
							)}
							{otherGroups.length > 0 && (
								<p className="break-all line-clamp-1">
									{!isTeacherView && group ? "+ " : ""}
									{otherGroups
										.map((group) => transformToGroupName(group))
										.join(", ")}
								</p>
							)}
						</div>
					</div>
				</button>
			</Touchable>
			<ModalRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
				<LessonModal
					lesson={lesson}
					onClassroomClick={(classroom) => {
						onClassroomClick?.(classroom)
						setIsOpen(false)
					}}
				/>
			</ModalRoot>
		</>
	)
}
