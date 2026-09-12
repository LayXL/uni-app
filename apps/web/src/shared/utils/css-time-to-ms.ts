export const cssTimeToMs = (value: string) => {
	const time = value.trim()
	return Number.parseFloat(time) * (time.endsWith("ms") ? 1 : 1_000)
}
