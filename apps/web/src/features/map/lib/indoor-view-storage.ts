import type { IndoorCameraView } from "./indoor-scene"

const KEY = "indoor-map-view-v1"
export type SavedIndoorView = IndoorCameraView & { floorId: number }

export const isSavedIndoorView = (value: unknown): value is SavedIndoorView => {
	if (!value || typeof value !== "object") return false
	const view = value as SavedIndoorView
	const validVector = (vector: unknown) =>
		Array.isArray(vector) &&
		vector.length === 3 &&
		vector.every(
			(n) =>
				typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 1_000_000,
		)
	return (
		Number.isInteger(view.floorId) &&
		(view.view === "3d" || view.view === "top") &&
		validVector(view.target) &&
		validVector(view.offset) &&
		view.offset[1] > 0 &&
		Math.hypot(...view.offset) < 90000 &&
		Number.isFinite(view.zoom) &&
		view.zoom >= 0.35 &&
		view.zoom <= 12
	)
}

export const readIndoorView = (): SavedIndoorView | null => {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null")
		return isSavedIndoorView(value) ? value : null
	} catch {
		return null
	}
}

export const saveIndoorView = (view: SavedIndoorView) => {
	try {
		localStorage.setItem(KEY, JSON.stringify(view))
	} catch {
		/* Storage is optional in embedded browsers. */
	}
}
