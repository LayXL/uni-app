export const TESTING_GROUP_ID = -123
export const TESTING_GROUP_DISPLAY_NAME = "Т-123"

export const testingGroup = {
	id: TESTING_GROUP_ID,
	bitrixId: "testing-group",
	displayName: TESTING_GROUP_DISPLAY_NAME,
	type: "studentsGroup" as const,
	isDeleted: false,
}

export const testingTeacherGroups = [
	{
		id: -1201,
		bitrixId: "testing-teacher-1",
		displayName: "Иванова Мария Сергеевна",
		type: "teacher" as const,
		isDeleted: false,
	},
	{
		id: -1202,
		bitrixId: "testing-teacher-2",
		displayName: "Петров Алексей Николаевич",
		type: "teacher" as const,
		isDeleted: false,
	},
	{
		id: -1203,
		bitrixId: "testing-teacher-3",
		displayName: "Соколова Анна Викторовна",
		type: "teacher" as const,
		isDeleted: false,
	},
	{
		id: -1204,
		bitrixId: "testing-teacher-4",
		displayName: "Кузнецов Дмитрий Павлович",
		type: "teacher" as const,
		isDeleted: false,
	},
]

export const isTestingGroupId = (groupId: number | undefined) =>
	groupId === TESTING_GROUP_ID

export const isTestingTeacherGroupId = (groupId: number | undefined) =>
	testingTeacherGroups.some((teacher) => teacher.id === groupId)

export const isTestingScheduleGroupId = (groupId: number | undefined) =>
	isTestingGroupId(groupId) || isTestingTeacherGroupId(groupId)
