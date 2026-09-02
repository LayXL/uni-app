import { Link } from "@tanstack/react-router"

import { getTeacherGender } from "@repo/shared/groups/get-teacher-gender"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

import { formatLessonTime } from "../lib/format-lesson-time"

type LessonModalProps = {
	lesson: Lesson
	group?: number
	onClassroomClick?: (classroomId: number) => void
}

export const LessonModal = ({
	lesson,
	group,
	onClassroomClick,
}: LessonModalProps) => {
	const teachers = lesson.groups.filter((group) => group.type === "teacher")
	const studentGroups = lesson.groups.filter(
		({ type }) => type === "studentsGroup",
	)
	const shouldShowStudentGroups =
		studentGroups.length > 0 &&
		!(studentGroups.length === 1 && studentGroups[0]?.id === group)

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-lg font-medium w-[calc(100%-3rem)]">
				{lesson.subject.name}
			</h2>
			<div className="flex items-center gap-1 text-muted tabular-nums">
				<Icon name="clock-outline-16" className="shrink-0" />
				<span>{formatLessonTime(lesson.startTime)}</span>
				<Icon name="arrow-right-12" className="shrink-0" />
				<span>{formatLessonTime(lesson.endTime)}</span>
			</div>
			{shouldShowStudentGroups && (
				<div className="flex items-center gap-1 text-muted">
					<Icon name="users-16" className="shrink-0" />
					<p>
						{studentGroups
							.map((group) => transformToGroupName(group))
							.join(", ")}
					</p>
				</div>
			)}
			{teachers.length > 0 &&
				teachers.map((teacher) => (
					<Touchable key={teacher.id}>
						<Link
							to="/schedule/$groupId"
							params={{ groupId: String(teacher.id) }}
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
						onClick={() => {
							if (lesson.classroomId !== undefined) {
								onClassroomClick?.(lesson.classroomId)
							}
						}}
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
