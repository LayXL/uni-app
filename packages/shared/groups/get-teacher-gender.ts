import { getGender } from "lvovich"

import { transformToGroupName } from "./transform-to-group-name"

export const getTeacherGender = (teacher: { displayName: string }) => {
	const transformedName = transformToGroupName(teacher)

	const [last, first, middle] = transformedName.split(" ")

	return getGender({ last, first, middle })
}
