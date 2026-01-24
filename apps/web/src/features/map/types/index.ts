import type * as fabric from "fabric"

export type ViewportState = {
	zoom: number
	rotation: number
	translateX: number
	translateY: number
}

export type FabricMatrix = [number, number, number, number, number, number]
export type PointerInfo = fabric.TPointerEventInfo<fabric.TPointerEvent>

export type MapColors = {
	floorFill: string
	floorStroke: string
	roomFill: string
	roomFillClickable: string
	roomStroke: string
	roomLabel: string
	stairsIcon: string
	route: string
}
