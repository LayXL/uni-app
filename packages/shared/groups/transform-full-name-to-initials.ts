import { NBSP } from "../nbsp"

export const transformFullNameToInitials = (name: string) => {
	return name.replace(/^(\S+)\s(\S)\S+\s(\S)\S+$/m, `$1${NBSP}$2.${NBSP}$3.`)
}
