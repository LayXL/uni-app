export const TESTING_GROUP_ID = -123
export const TESTING_GROUP_DISPLAY_NAME = "Т-123"

export const testingGroup = {
	id: TESTING_GROUP_ID,
	bitrixId: "testing-group",
	displayName: TESTING_GROUP_DISPLAY_NAME,
	type: "studentsGroup" as const,
	isDeleted: false,
}

export const isTestingGroupId = (groupId: number | undefined) =>
	groupId === TESTING_GROUP_ID
