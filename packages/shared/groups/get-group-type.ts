export const getGroupType = (group: {
	displayName: string
	isTeacher: boolean
}) => {
	if (group.isTeacher) return "teacher"
	if (group.displayName.match(/\d{3}/)) return "higher"
	return "college"
}
