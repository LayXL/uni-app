import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { orpc } from "@repo/orpc/react"
import { getTeacherGender } from "@repo/shared/groups/get-teacher-gender"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

import { formatLessonTime } from "../lib/format-lesson-time"

type LessonModalProps = {
	lesson: Lesson
	followingLessons?: Lesson[]
	group?: number
	onClassroomClick?: (classroomId: number) => void
}

const TeacherAvatar = ({ url }: { url?: string | null }) => {
	const [failedUrl, setFailedUrl] = useState<string | null>(null)
	if (!url || url === failedUrl) return null

	return (
		<img
			key={url}
			src={url}
			alt=""
			width={56}
			height={56}
			className="size-14 shrink-0 rounded-full object-cover object-top"
			onError={() => setFailedUrl(url)}
		/>
	)
}

export const LessonModal = ({
	lesson,
	followingLessons = [],
	group,
	onClassroomClick,
}: LessonModalProps) => {
	const teachers = lesson.groups.filter((group) => group.type === "teacher")
	const { data: groups } = useQuery({
		...orpc.groups.getAllGroups.queryOptions({}),
		enabled: teachers.length > 0,
	})
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
				<span>
					{[lesson, ...followingLessons]
						.map(
							(item) =>
								`${formatLessonTime(item.startTime)} → ${formatLessonTime(item.endTime)}`,
						)
						.join(", ")}
				</span>
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
							className="relative flex items-center gap-3 bg-card rounded-3xl p-4"
						>
							<LiquidBorder />
							<TeacherAvatar
								url={
									groups?.find(
										(group) =>
											group.type === "teacher" && group.id === teacher.id,
									)?.avatarUrl
								}
							/>
							<div className="min-w-0">
								<p className="text-lg font-medium wrap-break-word">
									{transformToGroupName(teacher)}
								</p>
								<p className="text-muted">
									{getTeacherGender(teacher) === "female"
										? "Преподавательница"
										: "Преподаватель"}
								</p>
							</div>
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
