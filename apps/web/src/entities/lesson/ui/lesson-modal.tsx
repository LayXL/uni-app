import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"

import { LiquidBorder } from "@/shared/ui/liquid-border"

type LessonModalProps = {
	lesson: Lesson
}

export const LessonModal = ({ lesson }: LessonModalProps) => {
	const teachers = lesson.groups.filter((group) => group.type === "teacher")

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-lg font-medium w-[calc(100%-3rem)]">
				{lesson.subject.name}
			</h2>
			<p className="text-muted">
				С {lesson.startTime} до {lesson.endTime}
			</p>
			{teachers.length > 0 &&
				teachers.map((teacher) => (
					<div key={teacher.id} className="relative bg-card rounded-3xl p-4">
						<LiquidBorder />
						<p className="text-lg font-medium">
							{transformToGroupName(teacher)}
						</p>
						<p className="text-muted">Преподаватель</p>
					</div>
				))}
			<div className="relative bg-card rounded-3xl p-4">
				<LiquidBorder />
				<p className="text-lg font-medium">{lesson.classroom}</p>
				<p className="text-muted">Аудитория</p>
			</div>
		</div>
	)
}
