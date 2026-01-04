import { create } from "zustand"

type Point = {
	floor: number
	x: number
	y: number
}

type State = {
	start?: Point
	end?: Point
	hasPoints: boolean
	setStart: (start: Point) => void
	setEnd: (end: Point) => void
	resetRoute: () => void
}

export const useRouteBuilder = create<State>((set) => ({
	start: undefined,
	end: undefined,
	hasPoints: false,
	setStart: (start) =>
		set((state) => ({ start, hasPoints: state.end !== undefined })),
	setEnd: (end) =>
		set((state) => ({ end, hasPoints: state.start !== undefined })),
	resetRoute: () => set({ start: undefined, end: undefined, hasPoints: false }),
}))
