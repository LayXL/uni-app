import { useSuspenseQuery } from "@tanstack/react-query"

import { orpc } from "@repo/orpc/react"

export const useMapData = () => {
	const { data: mapData } = useSuspenseQuery(orpc.map.getMap.queryOptions())

	return mapData
}
