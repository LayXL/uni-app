import { incline } from "lvovich"
import type { DeclentionStrT } from "lvovich/lib/inclineRules"

import { transformToGroupName } from "./transform-to-group-name"

export const inclineTeacherName = (
	teacher: { displayName: string },
	declension: DeclentionStrT,
) => {
	const transformedName = transformToGroupName(teacher)

	const [last, first, middle] = transformedName.split(" ")

	const inclinedName = incline({ last, first, middle }, declension)

	return `${inclinedName.last} ${inclinedName.first} ${inclinedName.middle}`
}
