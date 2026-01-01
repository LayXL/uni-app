import type * as fabric from "fabric"

type PointerEventLike = fabric.TPointerEvent | TouchEvent | MouseEvent

export const getPointerCoords = (event: PointerEventLike) => {
	if ("clientX" in event && typeof event.clientX === "number") {
		return { x: event.clientX, y: event.clientY }
	}

	const touch = (event as TouchEvent).touches?.[0]
	if (touch) {
		return { x: touch.clientX, y: touch.clientY }
	}

	return null
}
