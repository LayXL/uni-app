import type { MapColors } from "../types"

const defaultMapColors: MapColors = {
	floorFill: "#f2f5f9",
	floorStroke: "#dce2e9",
	roomFill: "#e6f2ff",
	roomFillClickable: "#e6f2ff",
	roomStroke: "#c8d9ec",
	selectedRoomStroke: "#fc4c01",
	roomLabel: "#0f172a",
	stairsIcon: "#ffffff",
	route: "#22c55e",
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
		selectedRoomStroke: getVar("--accent", defaultMapColors.selectedRoomStroke),
		roomLabel: getVar("--map-room-label", defaultMapColors.roomLabel),
		stairsIcon: getVar("--map-stairs-icon", defaultMapColors.stairsIcon),
		route: getVar("--map-route", defaultMapColors.route),
	}
}
