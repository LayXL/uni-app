import { create } from "zustand"

type Point = {
	floor: number
	x: number
	y: number
}

type State = {
	isActive: boolean
	isModalOpen: boolean
	startRoomId?: number
	endRoomId?: number
	start?: Point
	end?: Point
	hasPoints: boolean
	openModal: () => void
	closeModal: () => void
	setStartRoomId: (startRoomId: number) => void
	setEndRoomId: (endRoomId: number) => void
	setStart: (start: Point) => void
	setEnd: (end: Point) => void
	resetRoute: () => void
	setIsActive: (isActive: boolean) => void
}

export const useRouteBuilder = create<State>((set) => ({
	isActive: false,
	isModalOpen: false,
	startRoomId: undefined,
	endRoomId: undefined,
	start: undefined,
	end: undefined,
	hasPoints: false,
	openModal: () => set({ isModalOpen: true }),
	closeModal: () => set({ isModalOpen: false }),
	setStartRoomId: (startRoomId: number) => set({ startRoomId }),
	setEndRoomId: (endRoomId: number) => set({ endRoomId }),
	setStart: (start) =>
		set((state) => ({ start, hasPoints: state.end !== undefined })),
	setEnd: (end) =>
		set((state) => ({ end, hasPoints: state.start !== undefined })),
	resetRoute: () =>
		set({
			start: undefined,
			end: undefined,
			hasPoints: false,
			startRoomId: undefined,
			endRoomId: undefined,
			isActive: false,
		}),
	setIsActive: (isActive: boolean) => set({ isActive }),
}))
