import { create } from "zustand"

type SelectedRoomState = {
	selectedRoomId: number | null
	setSelectedRoomId: (id: number | null) => void
}

export const useSelectedRoom = create<SelectedRoomState>((set) => ({
	selectedRoomId: null,
	setSelectedRoomId: (selectedRoomId) => set({ selectedRoomId }),
}))
