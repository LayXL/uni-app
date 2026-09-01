import Link from "next/link"

import { getTeacherGender } from "@repo/shared/groups/get-teacher-gender"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

type LessonModalProps = {
	lesson: Lesson
	group?: number
	isTeacherView?: boolean
	onClassroomClick?: (classroom: string) => void
}

export const LessonModal = ({
	lesson,
	group,
	isTeacherView,
	onClassroomClick,
}: LessonModalProps) => {
	const teachers = lesson.groups.filter((group) => group.type === "teacher")
	const otherGroups = lesson.groups.filter(
		({ type, id }) => type === "studentsGroup" && id !== group,
	)

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-lg font-medium w-[calc(100%-3rem)]">
				{lesson.subject.name}
			</h2>
			<p className="text-muted">
				С {lesson.startTime} до {lesson.endTime}
			</p>
			{otherGroups.length > 0 && (
				<p className="text-muted">
					{group && !isTeacherView ? "Вместе с вами " : "На занятии "}
					{otherGroups.length === 1 ? "будет группа " : "будут группы "}
					{otherGroups.map((group) => transformToGroupName(group)).join(", ")}
				</p>
			)}
			{teachers.length > 0 &&
				teachers.map((teacher) => (
					<Touchable key={teacher.id}>
						<Link
							href={`/schedule/${teacher.id}`}
							className="relative bg-card rounded-3xl p-4"
						>
							<LiquidBorder />
							<p className="text-lg font-medium">
								{transformToGroupName(teacher)}
							</p>
							<p className="text-muted">
								{getTeacherGender(teacher) === "female"
									? "Преподавательница"
									: "Преподаватель"}
							</p>
						</Link>
					</Touchable>
				))}
			{!lesson.isDistance && (
				<Touchable>
					<button
						type="button"
						className="relative bg-card rounded-3xl p-4 text-left"
						onClick={() => onClassroomClick?.(lesson.classroom)}
					>
						<LiquidBorder />
						<p className="text-lg font-medium">{lesson.classroom}</p>
						<p className="text-muted">Аудитория</p>
					</button>
				</Touchable>
			)}
		</div>
	)
}
