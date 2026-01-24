import { create } from "zustand"

import { useUser } from "@/entities/user/hooks/useUser"

type State = {
	group?: {
		id: number
		displayName: string
	}
	setGroup: (group: { id: number; displayName: string }) => void
}

const useScheduleGroupWithoutUser = create<State>((set) => ({
	setGroup: (group) => set({ group }),
}))

export const useScheduleGroup = () => {
	const user = useUser()
	const { group, setGroup } = useScheduleGroupWithoutUser()

	return {
		currentGroupIsUserGroup: !(group && group?.id !== user.group?.id),
		group: group ?? user.group,
		setGroup,
	}
}
