import { type RefObject, useCallback, useLayoutEffect, useRef } from "react"

import type { Floor } from "@repo/shared/building-scheme"

import { getFloorTransition } from "../lib/floor-transition"

type UseFloorTransitionParams = {
	activeFloor: number
	floors: Floor[]
	canvasRef: RefObject<HTMLCanvasElement | null>
	enabled: boolean
}

export const useFloorTransition = ({
	activeFloor,
	floors,
	canvasRef,
	enabled,
}: UseFloorTransitionParams) => {
	const transitionRef = useRef<HTMLDivElement>(null)
	const liveLayerRef = useRef<HTMLDivElement>(null)
	const snapshotRef = useRef<HTMLCanvasElement>(null)
	const previousFloorRef = useRef(activeFloor)
	const pendingRef = useRef<{ floorId: number; start: () => void } | null>(null)

	useLayoutEffect(() => {
		const previousFloor = previousFloorRef.current
		previousFloorRef.current = activeFloor
		const transition = getFloorTransition(floors, previousFloor, activeFloor)
		const host = transitionRef.current
		const live = liveLayerRef.current
		const snapshot = snapshotRef.current
		const source = canvasRef.current
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
		if (!enabled || !transition || !host || !live || !snapshot || !source)
			return
		if (reducedMotion.matches || !source.width || !source.height) return

		// Copy the last painted floor before Fabric clears it. No image encoding or
		// second interactive map is needed, and the real viewport stays untouched.
		const context = snapshot.getContext("2d")
		if (!context) return
		snapshot.width = source.width
		snapshot.height = source.height
		context.drawImage(source, 0, 0)

		host.dataset.transition = transition.kind
		host.dataset.page = transition.fromPage
		live.dataset.pageId = transition.toPage
		snapshot.dataset.pageId = transition.fromPage
		live.inert = true

		let frame = 0
		let timer: ReturnType<typeof setTimeout> | undefined
		const finish = () => {
			cancelAnimationFrame(frame)
			clearTimeout(timer)
			pendingRef.current = null
			delete host.dataset.transition
			delete host.dataset.running
			host.dataset.page = "1"
			live.dataset.pageId = "1"
			snapshot.dataset.pageId = "2"
			live.inert = false
			snapshot.width = 0
			snapshot.height = 0
		}
		const onEnd = (event: TransitionEvent) => {
			if (event.target === live && event.propertyName === "transform") finish()
		}
		const onReducedMotion = () => {
			if (reducedMotion.matches) finish()
		}
		live.addEventListener("transitionend", onEnd)
		reducedMotion.addEventListener("change", onReducedMotion)

		pendingRef.current = {
			floorId: activeFloor,
			start: () => {
				// Resolve the starting styles while transitions are disabled, then
				// reveal the new floor only after its geometry and icons are painted.
				host.getBoundingClientRect()
				frame = requestAnimationFrame(() => {
					host.dataset.running = "true"
					host.dataset.page = transition.toPage
					const styles = getComputedStyle(host)
					const duration = (property: string) => {
						const value = styles.getPropertyValue(property).trim()
						return (
							(Number.parseFloat(value) || 0) *
							(value.endsWith("ms") ? 1 : 1000)
						)
					}
					timer = setTimeout(
						finish,
						Math.max(
							duration("--page-slide-dur"),
							duration("--page-fade-dur"),
						) + 100,
					)
				})
			},
		}

		return () => {
			finish()
			live.removeEventListener("transitionend", onEnd)
			reducedMotion.removeEventListener("change", onReducedMotion)
		}
	}, [activeFloor, canvasRef, enabled, floors])

	const onFloorReady = useCallback((floorId: number) => {
		const pending = pendingRef.current
		if (pending?.floorId !== floorId) return
		pendingRef.current = null
		pending.start()
	}, [])

	return { transitionRef, liveLayerRef, snapshotRef, onFloorReady }
}
