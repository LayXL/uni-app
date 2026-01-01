import { transformFullNameToInitials } from "@repo/shared/groups/transform-full-name-to-initials"
import { transformToGroupName } from "@repo/shared/groups/transform-to-group-name"
import type { Lesson } from "@repo/shared/lessons/types/lesson"
import { cutSubjectName } from "@repo/shared/subjects/cut-subject-name"

type LessonCardProps = {
	group: number
	lesson: Lesson
}

export const LessonCard = ({ lesson, group }: LessonCardProps) => {
	const otherGroups = lesson.groups.filter(
		({ type, id }) => type === "studentsGroup" && id !== group,
	)

	return (
		<div className="bg-card border border-border text-card-foreground px-2 py-2 rounded-xl flex items-center gap-2">
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
				<div className="flex gap-2 text-muted-foreground text-sm">
					<p className="min-w-max">{lesson.classroom} ауд.</p>
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
		</div>
	)
}
