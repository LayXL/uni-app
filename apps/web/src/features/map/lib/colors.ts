import type { MapColors } from "../types"

const defaultMapColors: MapColors = {
	floorFill: "#f3f4f6",
	floorStroke: "#cbd5e1",
	roomFill: "#e5e7eb",
	roomFillClickable: "#e2e8f0",
	roomStroke: "#94a3b8",
	roomLabel: "#0f172a",
}

export const getMapColors = (): MapColors => {
	if (typeof window === "undefined") return defaultMapColors

	const styles = getComputedStyle(document.documentElement)

	const getVar = (name: string, fallback: string) =>
		styles.getPropertyValue(name).trim() || fallback

	return {
		floorFill: getVar("--map-floor-fill", defaultMapColors.floorFill),
		floorStroke: getVar("--map-floor-stroke", defaultMapColors.floorStroke),
		roomFill: getVar("--map-room-fill", defaultMapColors.roomFill),
		roomFillClickable: getVar(
			"--map-room-fill-clickable",
			defaultMapColors.roomFillClickable,
		),
		roomStroke: getVar("--map-room-stroke", defaultMapColors.roomStroke),
		roomLabel: getVar("--map-room-label", defaultMapColors.roomLabel),
	}
}
