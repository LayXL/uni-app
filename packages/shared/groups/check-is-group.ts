import { checkIsTeacher } from "./check-is-teacher.ts"

export const checkIsGroup = (group: { isTeacher: boolean }) =>
  !checkIsTeacher(group)
