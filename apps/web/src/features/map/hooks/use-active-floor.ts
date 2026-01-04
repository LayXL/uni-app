import { create } from "zustand"

type ActiveFloorState = {
	activeFloor: number
	setActiveFloor: (floor: number) => void
}

export const useActiveFloor = create<ActiveFloorState>((set) => ({
	activeFloor: 0,
	setActiveFloor: (activeFloor) => set({ activeFloor }),
}))
