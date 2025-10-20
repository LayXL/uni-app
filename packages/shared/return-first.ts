export const returnFirst = <T>(arr: T[]): T | undefined => {
	if (arr.length === 0) return undefined
	return arr[0]
}
