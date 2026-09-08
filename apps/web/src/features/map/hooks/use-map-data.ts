import { useSuspenseQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"

import { layoutCampuses } from "../lib/campus-layout"

export const useMapData = () => {
	const { data: mapData } = useSuspenseQuery(orpc.map.getMap.queryOptions())

	return useMemo(() => layoutCampuses(mapData), [mapData])
}
