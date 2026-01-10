"use client"

import { useState } from "react"

import { transformFullNameToInitials } from "@repo/shared/groups/transform-full-name-to-initials"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"
import { cutSubjectName } from "@repo/shared/subjects/cut-subject-name"

import { ModalRoot } from "@/shared/ui/modal-root"
import { Touchable } from "@/shared/ui/touchable"

type LessonCardProps = {
	group: number
	lesson: Lesson
}

export const LessonCard = ({ lesson, group }: LessonCardProps) => {
	const [isOpen, setIsOpen] = useState(false)

	const otherGroups = lesson.groups.filter(
		({ type, id }) => type === "studentsGroup" && id !== group,
	)

	return (
		<>
			<Touchable>
				<button
					type="button"
					className="bg-card border border-border px-2 py-2 rounded-xl flex items-center gap-2"
					onClick={() => setIsOpen(true)}
				>
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
							<p className="min-w-max">{lesson.classroom} ауд</p>
							<p className="min-w-max">
								{lesson.groups
									.filter((group) => group.type === "teacher")
									.map((group) =>
										transformFullNameToInitials(transformToGroupName(group)),
									)
									.join(", ")}
							</p>
							{otherGroups.length > 0 && (
								<p className="break-all line-clamp-1">
									+{" "}
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
				<div className="flex flex-col gap-2">
					<h2 className="text-lg font-medium">{lesson.subject.name}</h2>
					<p className="text-muted text-sm">{lesson.classroom} ауд</p>
					<p className="text-muted text-sm">
						{lesson.groups
							.filter((group) => group.type === "teacher")
							.map((group) => transformToGroupName(group))
							.join(", ")}
					</p>
				</div>
			</ModalRoot>
		</>
	)
}
