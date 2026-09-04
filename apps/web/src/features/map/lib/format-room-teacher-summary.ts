import { inclineTeacherName } from "@repo/shared/groups/incline-teacher-name"
import { transformFullNameToInitials } from "@repo/shared/groups/transform-full-name-to-initials"

type Teacher = { id: number; displayName: string }

const formatTeachers = (teachers: Teacher[]) => {
	const uniqueTeachers = [
		...new Map(teachers.map((teacher) => [teacher.id, teacher])).values(),
	]
	const names = uniqueTeachers.map((teacher) =>
		transformFullNameToInitials(inclineTeacherName(teacher, "genitive")),
	)
	return new Intl.ListFormat("ru", { type: "conjunction" }).format(names)
}

const sentence = (prefix: string, teachers: Teacher[]) => {
	if (!teachers.length) return ""
	const text = `${prefix} ${formatTeachers(teachers)}`
	return text.endsWith(".") ? text : `${text}.`
}

export const formatRoomTeacherSummary = (summary: {
	previous: Teacher[]
	current: Teacher[]
}) =>
	[
		sentence("Тут была пара", summary.previous),
		sentence("Сейчас тут пара", summary.current),
	]
		.filter(Boolean)
		.join(" ")
