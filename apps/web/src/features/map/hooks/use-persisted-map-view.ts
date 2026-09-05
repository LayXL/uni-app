import { useEffect } from "react"

import { useCloudStorage } from "@/shared/hooks/use-cloud-storage"

import {
	isPersistedMapView,
	type PersistedMapView,
	persistMapView,
} from "../lib/persisted-map-view"
import { useActiveFloor } from "./use-active-floor"
import { useMapState } from "./use-map-state"

const MAP_VIEW_STORAGE_KEY = "map-view-v1"
const SAVE_DELAY = 400

export const usePersistedMapView = (enabled: boolean) => {
	const [storedView, setStoredView] = useCloudStorage<PersistedMapView | null>(
		MAP_VIEW_STORAGE_KEY,
		null,
	)

	useEffect(() => {
		if (!enabled) return

		let timer: ReturnType<typeof setTimeout> | undefined
		let pendingView: PersistedMapView | null = null

		const flush = () => {
			clearTimeout(timer)
			if (!pendingView) return
			setStoredView(pendingView)
			pendingView = null
		}

		const scheduleSave = () => {
			const state = useMapState.getState()
			if (state.canvasWidth <= 0 || state.canvasHeight <= 0) return

			const view = persistMapView(
				state,
				useActiveFloor.getState().activeFloor,
				state.canvasWidth,
				state.canvasHeight,
			)
			if (!isPersistedMapView(view)) return

			pendingView = view
			clearTimeout(timer)
			timer = setTimeout(flush, SAVE_DELAY)
		}

		const unsubscribeViewport = useMapState.subscribe(scheduleSave)
		const unsubscribeFloor = useActiveFloor.subscribe(scheduleSave)
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") flush()
		}

		scheduleSave()
		window.addEventListener("pagehide", flush)
		document.addEventListener("visibilitychange", handleVisibilityChange)

		return () => {
			unsubscribeViewport()
			unsubscribeFloor()
			window.removeEventListener("pagehide", flush)
			document.removeEventListener("visibilitychange", handleVisibilityChange)
			flush()
		}
	}, [enabled, setStoredView])

	if (storedView === undefined) return undefined
	return isPersistedMapView(storedView) ? storedView : null
}
