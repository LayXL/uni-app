import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

type LessonModalProps = {
	lesson: Lesson
}

export const LessonModal = ({ lesson }: LessonModalProps) => {
	const teachers = lesson.groups.filter((group) => group.type === "teacher")

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-lg font-medium w-[90%]">{lesson.subject.name}</h2>
			<p className="text-muted">
				С {lesson.startTime} до {lesson.endTime}
			</p>
			<div className="bg-card border border-border rounded-3xl p-4">
				<p className="text-lg font-medium">{lesson.classroom}</p>
				<p className="text-muted">Аудитория</p>
			</div>
			{teachers.length > 0 &&
				teachers.map((teacher) => (
					<div
						key={teacher.id}
						className="bg-card border border-border rounded-3xl p-4"
					>
						<p className="text-lg font-medium">
							{transformToGroupName(teacher)}
						</p>
						<p className="text-muted">Преподаватель</p>
					</div>
				))}
		</div>
	)
}
