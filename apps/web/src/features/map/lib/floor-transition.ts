import type { Floor } from "@repo/shared/building-scheme"

export const getFloorTransition = (
	floors: Floor[],
	fromId: number,
	toId: number,
) => {
	const from = floors.find((floor) => floor.id === fromId)
	const to = floors.find((floor) => floor.id === toId)
	if (!from || !to || from.id === to.id) return null

	const fromPage = from.name.includes("школы") ? "2" : "1"
	const toPage = to.name.includes("школы") ? "2" : "1"
	if (fromPage !== toPage) return { kind: "slide", fromPage, toPage }

	const level = (floor: Floor) => {
		const number = Number.parseFloat(
			(floor.acronym ?? floor.name).replace(",", "."),
		)
		return Number.isFinite(number) ? number : floors.indexOf(floor)
	}
	return {
		kind: level(to) > level(from) ? "zoom-in" : "zoom-out",
		fromPage: "1",
		toPage: "2",
	}
}
