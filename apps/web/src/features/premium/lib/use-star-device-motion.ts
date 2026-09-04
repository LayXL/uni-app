import { type RefObject, useEffect, useRef, useState } from "react"

import { type DevicePose, getDeviceTilt } from "./device-tilt"

type MotionAccess =
	| "unavailable"
	| "prompt"
	| "requesting"
	| "enabled"
	| "denied"
type OrientationAPI = typeof DeviceOrientationEvent & {
	requestPermission?: () => Promise<"granted" | "denied">
}

export function useStarDeviceMotion(
	sceneRef: RefObject<HTMLDivElement | null>,
	deviceTilt: RefObject<{ x: number; y: number }>,
) {
	const [access, setAccess] = useState<MotionAccess>("unavailable")
	const [reducedMotion, setReducedMotion] = useState(true)
	const [receivingMotion, setReceivingMotion] = useState(false)
	const mounted = useRef(false)

	useEffect(() => {
		mounted.current = true
		const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
		const updatePreference = () => setReducedMotion(preference.matches)
		updatePreference()
		preference.addEventListener("change", updatePreference)
		const api = window.DeviceOrientationEvent as OrientationAPI | undefined
		if (window.isSecureContext && api) {
			setAccess(
				typeof api.requestPermission === "function" ? "prompt" : "enabled",
			)
		}
		return () => {
			mounted.current = false
			preference.removeEventListener("change", updatePreference)
		}
	}, [])

	useEffect(() => {
		const scene = sceneRef.current
		if (!scene) return
		let inView = true
		let listening = false
		let neutral: DevicePose | null = null
		let received = false

		const reset = () => {
			neutral = null
			deviceTilt.current = { x: 0, y: 0 }
		}
		const onOrientation = (event: DeviceOrientationEvent) => {
			if (
				event.beta === null ||
				event.gamma === null ||
				!Number.isFinite(event.beta) ||
				!Number.isFinite(event.gamma)
			)
				return
			const pose = { beta: event.beta, gamma: event.gamma }
			// The way the phone is held on entry becomes the neutral position.
			neutral ??= pose
			const screenAngle =
				window.screen.orientation?.angle ??
				(window as Window & { orientation?: number }).orientation ??
				0
			deviceTilt.current = getDeviceTilt(pose, neutral, screenAngle)
			if (!received) {
				received = true
				setReceivingMotion(true)
			}
		}
		const updateActivity = () => {
			const paused = document.hidden || !inView || reducedMotion
			scene.dataset.motionPaused = String(paused)
			const shouldListen = !paused && access === "enabled"
			if (shouldListen === listening) return
			listening = shouldListen
			if (listening) {
				window.addEventListener("deviceorientation", onOrientation, {
					passive: true,
				})
			} else {
				window.removeEventListener("deviceorientation", onOrientation)
				reset()
			}
		}
		const observer = new IntersectionObserver(([entry]) => {
			inView = entry.isIntersecting
			updateActivity()
		})
		observer.observe(scene)
		document.addEventListener("visibilitychange", updateActivity)
		window.screen.orientation?.addEventListener("change", reset)
		window.addEventListener("orientationchange", reset)
		updateActivity()
		return () => {
			observer.disconnect()
			document.removeEventListener("visibilitychange", updateActivity)
			window.screen.orientation?.removeEventListener("change", reset)
			window.removeEventListener("orientationchange", reset)
			window.removeEventListener("deviceorientation", onOrientation)
			reset()
		}
	}, [access, reducedMotion, sceneRef, deviceTilt])

	async function requestMotion() {
		const api = window.DeviceOrientationEvent as OrientationAPI | undefined
		if (access !== "prompt" || reducedMotion || !api?.requestPermission) return
		setAccess("requesting")
		try {
			// Invoke directly from the button gesture, as required by iOS Safari.
			const permission = await api.requestPermission()
			if (mounted.current)
				setAccess(permission === "granted" ? "enabled" : "denied")
		} catch {
			if (mounted.current) setAccess("denied")
		}
	}

	return { access, reducedMotion, receivingMotion, requestMotion }
}
