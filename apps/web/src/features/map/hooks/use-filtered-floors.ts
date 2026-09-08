import { useMemo } from "react"

import type { BuildingScheme } from "@repo/shared/building-scheme"

export const useFilteredFloors = (
	data: BuildingScheme | undefined,
	activeCampus: number,
) =>
	useMemo(
		() =>
			data?.floors
				.filter(
					(floor) => floor.name.includes("школы") === (activeCampus === 1),
				)
				.toSorted(
					(a, b) =>
						Number.parseFloat((b.acronym ?? b.name).replace(",", ".")) -
						Number.parseFloat((a.acronym ?? a.name).replace(",", ".")),
				),
		[data, activeCampus],
	)
