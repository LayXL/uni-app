import { checkIsTeacher } from "./check-is-teacher"

export const checkIsGroup = (group: { isTeacher: boolean }) =>
	!checkIsTeacher(group)
