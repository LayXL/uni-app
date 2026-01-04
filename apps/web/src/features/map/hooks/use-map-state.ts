import { create } from "zustand"

import type { ViewportState } from "../types"

type MapState = ViewportState & {
	canvasWidth: number
	canvasHeight: number
	setViewport: (viewport: ViewportState) => void
	setZoom: (zoom: number) => void
	setRotation: (rotation: number) => void
	setTranslateX: (translateX: number) => void
	setTranslateY: (translateY: number) => void
	setCanvasSize: (width: number, height: number) => void
	moveTo: (x: number, y: number) => void
}

export const useMapState = create<MapState>((set, get) => ({
	zoom: 1,
	rotation: 0,
	translateX: 0,
	translateY: 0,
	canvasWidth: 0,
	canvasHeight: 0,
	setViewport: (viewport) => set(viewport),
	setZoom: (zoom) => set({ zoom }),
	setRotation: (rotation) => set({ rotation }),
	setTranslateX: (translateX) => set({ translateX }),
	setTranslateY: (translateY) => set({ translateY }),
	setCanvasSize: (width, height) =>
		set({ canvasWidth: width, canvasHeight: height }),
	moveTo: (x, y) => {
		const { zoom, rotation, canvasWidth, canvasHeight } = get()
		const cos = Math.cos(rotation)
		const sin = Math.sin(rotation)

		// Calculate transform components
		const a = zoom * cos
		const b = zoom * sin
		const c = -zoom * sin
		const d = zoom * cos

		// Calculate target screen position (center of canvas)
		const targetScreenX = canvasWidth / 2
		const targetScreenY = canvasHeight / 2

		// Calculate required translation
		// x' = ax + cy + tx  =>  tx = x' - (ax + cy)
		// y' = bx + dy + ty  =>  ty = y' - (bx + dy)
		const translateX = targetScreenX - (a * x + c * y)
		const translateY = targetScreenY - (b * x + d * y)

		set({ translateX, translateY })
	},
}))
