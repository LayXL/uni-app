import type { ViewportState } from "../types"

export type PersistedMapView = {
	version: 1
	floorId: number
	centerX: number
	centerY: number
	zoom: number
	rotation: number
}

export const isPersistedMapView = (
	value: unknown,
): value is PersistedMapView => {
	if (!value || typeof value !== "object") return false
	const view = value as PersistedMapView
	return (
		view.version === 1 &&
		Number.isInteger(view.floorId) &&
		Number.isFinite(view.centerX) &&
		Number.isFinite(view.centerY) &&
		Number.isFinite(view.zoom) &&
		view.zoom >= 0.05 &&
		view.zoom <= 8 &&
		Number.isFinite(view.rotation)
	)
}

export const persistMapView = (
	viewport: ViewportState,
	floorId: number,
	width: number,
	height: number,
): PersistedMapView => {
	const x = (width / 2 - viewport.translateX) / viewport.zoom
	const y = (height / 2 - viewport.translateY) / viewport.zoom
	const cos = Math.cos(viewport.rotation)
	const sin = Math.sin(viewport.rotation)

	return {
		version: 1,
		floorId,
		centerX: cos * x + sin * y,
		centerY: -sin * x + cos * y,
		zoom: viewport.zoom,
		rotation: viewport.rotation,
	}
}

export const restoreMapView = (
	view: PersistedMapView,
	width: number,
	height: number,
): ViewportState => {
	const cos = Math.cos(view.rotation)
	const sin = Math.sin(view.rotation)

	return {
		zoom: view.zoom,
		rotation: view.rotation,
		translateX:
			width / 2 - view.zoom * (cos * view.centerX - sin * view.centerY),
		translateY:
			height / 2 - view.zoom * (sin * view.centerX + cos * view.centerY),
	}
}
