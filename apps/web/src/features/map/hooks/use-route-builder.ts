import { create } from "zustand"

type Point = {
	floor: number
	x: number
	y: number
}

type State = {
	start?: Point
	end?: Point
	route?: {
		floor: number
		x: number
		y: number
		type: "road" | "stairs"
		toFloor: number | null
	}[]
	setStart: (start: Point) => void
	setEnd: (end: Point) => void
	resetRoute: () => void
	setRoute: (
		route: {
			floor: number
			x: number
			y: number
			type: "road" | "stairs"
			toFloor: number | null
		}[],
	) => void
}

export const useRouteBuilder = create<State>((set) => ({
	setStart: (start) => set({ start }),
	setEnd: (end) => set({ end }),
	setRoute: (route) => set({ route }),
	resetRoute: () => set({ start: undefined, end: undefined, route: undefined }),
}))
