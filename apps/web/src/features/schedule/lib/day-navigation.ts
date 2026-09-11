export const getSwipeDayOffset = (deltaX: number, deltaY: number) => {
	if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.5)
		return 0
	return deltaX < 0 ? 1 : -1
}

export const getDayDragOffset = (
	deltaX: number,
	width: number,
	hasPrevious: boolean,
	hasNext: boolean,
) => {
	const atEdge = (deltaX > 0 && !hasPrevious) || (deltaX < 0 && !hasNext)
	return Math.max(-width, Math.min(width, atEdge ? deltaX * 0.2 : deltaX))
}

export const getAdjacentDate = (
	dates: string[],
	selectedDate: string,
	offset: number,
) => {
	const index = dates.indexOf(selectedDate)
	if (index < 0) return dates[0] ?? selectedDate
	return (
		dates[Math.max(0, Math.min(dates.length - 1, index + offset))] ??
		selectedDate
	)
}
