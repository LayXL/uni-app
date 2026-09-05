import type { Floor } from "@repo/shared/building-scheme"

const floorColors: Record<string, { light: string; dark: string }> = {
	"1": { light: "#d5e0de", dark: "#293638" },
	"2": { light: "#d7dce3", dark: "#2b3546" },
	"2.5": { light: "#e2dadc", dark: "#33333f" },
	"3": { light: "#e1d7d7", dark: "#33333c" },
	"4": { light: "#e0d7dd", dark: "#31333f" },
}

export const getFloorColor = (
	floor: Pick<Floor, "name">,
	theme: "light" | "dark",
	fallback: string,
) => {
	// Match university floor names, leaving the school palette independent.
	const number = floor.name.trim().match(/^(\d+(?:[.,]\d+)?)\s+этаж$/i)?.[1]
	return (number && floorColors[number.replace(",", ".")]?.[theme]) || fallback
}
