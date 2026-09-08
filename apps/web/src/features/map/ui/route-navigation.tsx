"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react"

import { orpc } from "@repo/orpc/react"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { useDisableScroll } from "@/shared/hooks/use-disable-scroll"
import { Button } from "@/shared/ui/button"
import { TRANSITION } from "@/shared/ui/modal-root"
import { usePopupClose } from "@/shared/ui/popup"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useMapData } from "../hooks/use-map-data"
import { useMapState } from "../hooks/use-map-state"
import { buildSteps } from "../lib/route-steps"

export const RouteNavigation = () => {
	const mapData = useMapData()
	const shouldReduceMotion = useReducedMotion()

	const { start, end, endNearestToilet, isActive, resetRoute } =
		useRouteBuilder()

	const setActiveFloor = useActiveFloor((state) => state.setActiveFloor)
	const moveTo = useMapState((state) => state.moveTo)

	const [currentStep, setCurrentStep] = useState(0)
	const carouselRef = useRef<HTMLDivElement>(null)
	const cardRef = useRef<HTMLDivElement>(null)
	const pointerGesture = useRef<{
		id: number
		x: number
		y: number
		scrollLeft: number
		dragging: boolean
	} | null>(null)
	const suppressClick = useRef(false)

	const { data } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input:
				start && (end || endNearestToilet) && isActive
					? { start, end, nearestToilet: endNearestToilet }
					: skipToken,
		}),
	)

	useDisableScroll(isActive)

	usePopupClose(isActive, resetRoute)

	useEffect(() => {
		if (isActive) {
			requestAnimationFrame(() => {
				window.scrollTo({ top: 0, behavior: "smooth" })
			})
		}
	}, [isActive])

	const steps = useMemo(
		() => buildSteps(data?.route ?? [], mapData),
		[data?.route, mapData],
	)

	useEffect(() => {
		if (!isActive || steps.length === 0) return

		setCurrentStep(0)
		if (carouselRef.current) carouselRef.current.scrollLeft = 0
	}, [steps, isActive])

	useEffect(() => {
		const card = cardRef.current
		const carousel = carouselRef.current
		if (!isActive || !card || !carousel || steps.length === 0) return

		let settleTimer: ReturnType<typeof setTimeout> | undefined
		let isWheeling = false

		const stopWheel = () => {
			clearTimeout(settleTimer)
			if (!isWheeling) return
			isWheeling = false
			carousel.style.scrollSnapType = ""
		}

		const settleWheel = () => {
			if (!isWheeling || carousel.clientWidth === 0) return
			const index = Math.round(carousel.scrollLeft / carousel.clientWidth)
			stopWheel()
			carousel.scrollTo({
				left: index * carousel.clientWidth,
				behavior: shouldReduceMotion ? "instant" : "smooth",
			})
		}

		const onWheel = (event: WheelEvent) => {
			if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY))
				return

			event.preventDefault()
			event.stopPropagation()
			if (pointerGesture.current || carousel.clientWidth === 0) return

			isWheeling = true
			carousel.style.scrollSnapType = "none"
			clearTimeout(settleTimer)
			const unit =
				event.deltaMode === 1
					? 16
					: event.deltaMode === 2
						? carousel.clientWidth
						: 1
			carousel.scrollTo({
				left: carousel.scrollLeft + event.deltaX * unit,
				behavior: "instant",
			})
			settleTimer = setTimeout(settleWheel, 180)
		}

		card.addEventListener("wheel", onWheel, { passive: false })
		card.addEventListener("pointerdown", stopWheel)
		card.addEventListener("keydown", settleWheel)
		return () => {
			stopWheel()
			card.removeEventListener("wheel", onWheel)
			card.removeEventListener("pointerdown", stopWheel)
			card.removeEventListener("keydown", settleWheel)
		}
	}, [isActive, steps, shouldReduceMotion])

	useEffect(() => {
		if (!isActive) return

		const step = steps[currentStep]
		if (!step) return

		setActiveFloor(step.floor)
		const floor = mapData.floors.find((f) => f.id === step.floor)
		moveTo(step.x + (floor?.position.x ?? 0), step.y + (floor?.position.y ?? 0))
	}, [currentStep, steps, isActive, mapData.floors, moveTo, setActiveFloor])

	const isLastStep = currentStep === steps.length - 1

	const selectStep = (index: number) => {
		const carousel = carouselRef.current
		if (!carousel) return

		carousel.scrollTo({
			left: index * carousel.clientWidth,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
				? "instant"
				: "smooth",
		})
	}

	const finishDrag = (
		event: PointerEvent<HTMLDivElement>,
		cancelled = false,
	) => {
		const gesture = pointerGesture.current
		const carousel = carouselRef.current
		if (!gesture || gesture.id !== event.pointerId || !carousel) return

		pointerGesture.current = null
		if (!gesture.dragging) return

		const distance = gesture.x - event.clientX
		const startIndex = Math.round(gesture.scrollLeft / carousel.clientWidth)
		const direction =
			!cancelled && Math.abs(distance) >= 40 ? Math.sign(distance) : 0
		carousel.style.scrollSnapType = ""
		selectStep(Math.max(0, Math.min(steps.length - 1, startIndex + direction)))
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId)
		}
	}

	return (
		<AnimatePresence>
			{isActive && (
				<motion.div
					key="exit"
					initial={{ opacity: 0, y: -16 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -16 }}
					transition={TRANSITION}
					className="absolute top-[calc(var(--safe-area-inset-top,0px)+0.75rem)] left-[calc(var(--safe-area-inset-left,0px)+4.5rem)] right-[calc(var(--safe-area-inset-right,0px)+4.5rem)] z-50 flex justify-center"
				>
					<Button
						variant="secondary"
						size="sm"
						label="Завершить навигацию"
						className="min-h-11 whitespace-normal text-center shadow-lg"
						onClick={resetRoute}
					/>
				</motion.div>
			)}
			{isActive && steps.length > 0 && (
				<motion.div
					key="steps"
					ref={cardRef}
					onPointerDown={(event) => {
						if (!event.isPrimary || event.button !== 0 || !carouselRef.current)
							return
						suppressClick.current = false
						pointerGesture.current = {
							id: event.pointerId,
							x: event.clientX,
							y: event.clientY,
							scrollLeft: carouselRef.current.scrollLeft,
							dragging: false,
						}
					}}
					onPointerMove={(event) => {
						const gesture = pointerGesture.current
						const carousel = carouselRef.current
						if (!gesture || gesture.id !== event.pointerId || !carousel) return

						const distance = gesture.x - event.clientX
						if (!gesture.dragging) {
							if (
								Math.abs(distance) < 6 ||
								Math.abs(distance) <= Math.abs(gesture.y - event.clientY)
							)
								return
							gesture.dragging = true
							suppressClick.current = true
							carousel.style.scrollSnapType = "none"
							event.currentTarget.setPointerCapture(event.pointerId)
						}
						event.preventDefault()
						carousel.scrollTo({
							left: gesture.scrollLeft + distance,
							behavior: "instant",
						})
					}}
					onPointerUp={(event) => finishDrag(event)}
					onPointerCancel={(event) => finishDrag(event, true)}
					onLostPointerCapture={(event) => finishDrag(event, true)}
					onClickCapture={(event) => {
						if (!suppressClick.current || event.detail === 0) return
						suppressClick.current = false
						event.preventDefault()
						event.stopPropagation()
					}}
					initial={{ opacity: 0, y: "100%" }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: "100%" }}
					transition={TRANSITION}
					className="absolute bottom-[calc(var(--safe-area-inset-bottom,0px)+0.75rem)] left-[max(0.75rem,var(--safe-area-inset-left,0px))] right-[max(0.75rem,var(--safe-area-inset-right,0px))] z-50 mx-auto max-w-lg touch-pan-y select-none cursor-grab active:cursor-grabbing overflow-hidden rounded-[1.75rem] border border-border bg-background/95 px-3 pb-3 pt-1 shadow-[0_8px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl"
				>
					{steps.length > 1 && (
						<div
							role="group"
							aria-label="Шаги маршрута"
							className="flex justify-center flex-wrap"
						>
							{steps.map((step, i) => (
								<Touchable key={i}>
									<button
										type="button"
										aria-label={`Шаг ${i + 1}: ${step.title}`}
										aria-current={i === currentStep ? "step" : undefined}
										className="grid h-6 w-4 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"
										onClick={() => selectStep(i)}
									>
										<span
											className={cn(
												"size-2 rounded-full transition-colors",
												i === currentStep ? "bg-accent" : "bg-border",
											)}
										/>
									</button>
								</Touchable>
							))}
						</div>
					)}
					<div
						ref={carouselRef}
						role="region"
						aria-roledescription="карусель"
						aria-label="Инструкции маршрута"
						// biome-ignore lint/a11y/noNoninteractiveTabindex: The scrollable carousel supports keyboard navigation.
						tabIndex={0}
						className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:outline-accent rounded-xl"
						onScroll={(event) => {
							const carousel = event.currentTarget
							if (carousel.clientWidth === 0) return
							setCurrentStep(
								Math.max(
									0,
									Math.min(
										steps.length - 1,
										Math.round(carousel.scrollLeft / carousel.clientWidth),
									),
								),
							)
						}}
						onKeyDown={(event) => {
							if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
								return
							event.preventDefault()
							selectStep(
								Math.max(
									0,
									Math.min(
										steps.length - 1,
										currentStep + (event.key === "ArrowRight" ? 1 : -1),
									),
								),
							)
						}}
					>
						{steps.map((step, i) => (
							<div
								key={i}
								role="group"
								aria-roledescription="слайд"
								aria-label={`${i + 1} из ${steps.length}`}
								aria-hidden={i !== currentStep}
								className="flex min-h-16 w-full shrink-0 snap-center snap-always items-center justify-center px-2 py-2 text-center text-lg font-medium select-none"
							>
								{step.title}
							</div>
						))}
					</div>
					<motion.div
						initial={false}
						animate={{
							height: isLastStep ? "auto" : 0,
							opacity: isLastStep ? 1 : 0,
						}}
						transition={{
							duration: shouldReduceMotion ? 0 : 0.25,
							ease: "easeInOut",
						}}
						inert={!isLastStep}
						aria-hidden={!isLastStep}
						className="overflow-hidden"
					>
						<div className="pt-1">
							<Button
								variant="accent"
								leftIcon="done-24"
								label="Завершить навигацию"
								className="w-full rounded-2xl"
								onClick={resetRoute}
							/>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
