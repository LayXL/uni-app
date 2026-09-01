const classroomNames = new Map([
	["305aкт", "Актовый зал"],
	["305акт", "Актовый зал"],
])

export const normalizeClassroomName = (classroom: string) =>
	classroomNames.get(classroom.trim().toLocaleLowerCase("ru-RU")) ?? classroom
