import { type RefObject, useEffect, useRef } from "react"

import type { BuildingScheme } from "@repo/shared/building-scheme"

import type { IndoorRoutePoint } from "../lib/indoor-geometry"
import {
	createIndoorScene,
	type IndoorCameraView,
	type IndoorScene,
	type IndoorView,
} from "../lib/indoor-scene"
import type { SavedIndoorView } from "../lib/indoor-view-storage"

import "./indoor-map.css"

type IndoorMapCanvasProps = {
	active?: boolean
	data: BuildingScheme
	activeFloor: number
	selectedRoomId: number | null
	theme: "light" | "dark"
	view: IndoorView
	route?: IndoorRoutePoint[]
	sceneRef: RefObject<IndoorScene | null>
	savedView?: SavedIndoorView | null
	onSelect: (id: number) => void
	onFloor: (id: number) => void
	onError: () => void
	onCamera?: (camera: IndoorCameraView) => void
}

export const IndoorMapCanvas = (props: IndoorMapCanvasProps) => {
	const hostRef = useRef<HTMLDivElement>(null)
	const callbacks = useRef(props)
	useEffect(() => {
		callbacks.current = props
	})
	const {
		data,
		active = true,
		activeFloor,
		selectedRoomId,
		theme,
		view,
		route,
		sceneRef,
		savedView,
	} = props
	const restored = useRef(false)

	useEffect(() => {
		if (!hostRef.current) return
		let scene: IndoorScene
		try {
			scene = createIndoorScene(hostRef.current, {
				onSelect: (id) => callbacks.current.onSelect(id),
				onFloor: (id) => callbacks.current.onFloor(id),
				onError: () => callbacks.current.onError(),
				onCamera: (camera) => callbacks.current.onCamera?.(camera),
			})
		} catch {
			callbacks.current.onError()
			return
		}
		sceneRef.current = scene
		return () => {
			scene.dispose()
			sceneRef.current = null
			restored.current = false
		}
	}, [sceneRef])

	useEffect(() => {
		sceneRef.current?.setActive(active)
	}, [active, sceneRef])

	useEffect(() => {
		sceneRef.current?.setFloor(data, activeFloor, theme)
	}, [data, activeFloor, theme, sceneRef])
	useEffect(() => {
		sceneRef.current?.setView(view)
	}, [view, sceneRef])
	useEffect(() => {
		if (!restored.current && savedView?.floorId === activeFloor) {
			sceneRef.current?.restore(savedView)
			restored.current = true
		}
	}, [activeFloor, savedView, sceneRef])
	// biome-ignore lint/correctness/useExhaustiveDependencies: A replaced floor needs its selection reapplied.
	useEffect(() => {
		sceneRef.current?.select(selectedRoomId)
	}, [selectedRoomId, activeFloor, sceneRef])
	// biome-ignore lint/correctness/useExhaustiveDependencies: Rebuilding floor geometry clears its route layer.
	useEffect(() => {
		sceneRef.current?.setRoute(route)
	}, [route, activeFloor, data, theme, sceneRef])

	return <div ref={hostRef} className="indoor-map-host" data-theme={theme} />
}
