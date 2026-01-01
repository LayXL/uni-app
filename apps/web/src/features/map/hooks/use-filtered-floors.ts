import { useMemo } from "react"

import type { Floor } from "@repo/shared/building-scheme"

export const useFilteredFloors = (
	data: Floor[] | undefined,
	activeCampus: number,
) =>
	useMemo(
		() =>
			data?.filter(
				(floor) => floor.name.includes("школы") === (activeCampus === 1),
			),
		[data, activeCampus],
	)
