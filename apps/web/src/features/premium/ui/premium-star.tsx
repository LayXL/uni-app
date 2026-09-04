import { useEffect, useRef, useState } from "react"

import { haptic } from "@/shared/utils/haptic"

import { createStarParticles } from "../lib/star-particles"
import type { StarScene } from "../lib/star-scene"
import { useStarDeviceMotion } from "../lib/use-star-device-motion"
import { useStarPointer } from "../lib/use-star-pointer"

// Local Iconify asset: iconify:material-symbols:star-rounded.
const STAR_URL = "/icons/iconify/material-symbols/star-rounded.svg"

export function PremiumStar() {
	const sceneRef = useRef<HTMLDivElement>(null)
	const canvasHost = useRef<HTMLSpanElement>(null)
	const particleCanvas = useRef<HTMLCanvasElement>(null)
	const particles = useRef<ReturnType<typeof createStarParticles> | null>(null)
	const deviceTilt = useRef({ x: 0, y: 0 })
	const scene = useRef<StarScene | null>(null)
	const [ready, setReady] = useState(false)
	const { access, reducedMotion, receivingMotion, requestMotion } =
		useStarDeviceMotion(sceneRef, deviceTilt)

	useEffect(() => {
		if (!particleCanvas.current) return
		const instance = createStarParticles(particleCanvas.current)
		particles.current = instance
		return () => {
			instance.dispose()
			particles.current = null
		}
	}, [])

	useEffect(() => {
		const host = canvasHost.current
		if (!host) return
		const controller = new AbortController()
		let instance: StarScene | null = null
		// Three.js loads only when this page opens; the SVG is also the loading fallback.
		Promise.all([
			import("../lib/star-scene"),
			fetch(STAR_URL, { signal: controller.signal }).then((response) => {
				if (!response.ok) throw new Error("Star icon unavailable")
				return response.text()
			}),
		])
			.then(([{ createStarScene }, svg]) => {
				if (controller.signal.aborted) return
				instance = createStarScene(
					host,
					svg,
					() => deviceTilt.current,
					() => setReady(false),
				)
				scene.current = instance
				setReady(true)
			})
			.catch(() => {
				if (!controller.signal.aborted) setReady(false)
			})
		return () => {
			controller.abort()
			instance?.dispose()
			scene.current = null
		}
	}, [])

	function activate(x: number, y: number, double: boolean) {
		haptic(double ? "medium" : "light")
		scene.current?.press(x, y, double)
		particles.current?.boost(double)
	}

	const pointerHandlers = useStarPointer(scene, activate)

	return (
		<div className="premium-scene" ref={sceneRef}>
			<canvas
				className="premium-star-particles"
				ref={particleCanvas}
				tabIndex={-1}
				aria-hidden="true"
			/>
			<button
				type="button"
				className="premium-star-button"
				{...pointerHandlers}
				aria-label="Покрутить звезду МЭПП+"
			>
				{!ready && (
					<span className="premium-star-fallback" aria-hidden="true" />
				)}
				<span
					className="premium-star-canvas"
					ref={canvasHost}
					aria-hidden="true"
					style={{ visibility: ready ? "visible" : "hidden" }}
				/>
			</button>
			{!reducedMotion && (access === "prompt" || access === "requesting") && (
				<button
					type="button"
					className="premium-motion-button"
					onClick={requestMotion}
					disabled={access === "requesting"}
				>
					{access === "requesting" ? "Подключаем" : "Включить наклон телефона"}
				</button>
			)}
			{!reducedMotion && (receivingMotion || access === "denied") && (
				<p className="premium-motion-hint" role="status">
					{access === "denied"
						? "Датчик недоступен, но нажатия по-прежнему работают"
						: "А ещё — наклоняй телефон"}
				</p>
			)}
		</div>
	)
}
