"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import type { z } from "zod"

import { orpc } from "@repo/orpc/react"
import type { routeSchema } from "@repo/orpc/routes/map/build-route"
import type { BuildingScheme } from "@repo/shared/building-scheme"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { useDisableScroll } from "@/shared/hooks/use-disable-scroll"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { TRANSITION } from "@/shared/ui/modal-root"
import { usePopupClose } from "@/shared/ui/popup"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useMapData } from "../hooks/use-map-data"
import { useMapState } from "../hooks/use-map-state"

type StepIconProps = {
	name: IconName
	isActive?: boolean
}

const StepIcon = ({ name, isActive }: StepIconProps) => {
	return (
		<div
			className={cn(
				"size-12 grid place-items-center rounded-full bg-card transition-colors relative",
				isActive && "bg-accent text-accent-foreground",
			)}
		>
			<LiquidBorder />
			<Icon name={name} size={24} />
		</div>
	)
}

type Step = {
	icon: IconName
	title: string
	x: number
	y: number
	floor: number
}

const buildSteps = (
	route: z.infer<typeof routeSchema>,
	data: BuildingScheme,
) => {
	const steps: Step[] = []

	const points = [
		route[0],
		...route.reduce(
			(acc, step, i) => {
				if (step.type === "stairs") {
					acc.push(route[i + 1])
				}
				return acc
			},
			[] as typeof route,
		),
	]

	let lastPointIndex = 0

	for (let i = 0; i < route.length; i++) {
		const step = route[i]

		if (step.type === "stairs") {
			const direction = step.toFloor
				? step.toFloor > step.floor
					? "up"
					: "down"
				: undefined

			const targetFloor = data.floors.find((f) => f.id === step.toFloor)
			const floorLabel = targetFloor?.acronym ?? step.toFloor

			steps.push({
				icon:
					step.floor === 1 && step.toFloor === 5
						? "seven"
						: step.floor === 5 && step.toFloor === 1
							? "midis"
							: "stairs",
				x: points[lastPointIndex].x,
				y: points[lastPointIndex].y,
				floor: points[lastPointIndex].floor,
				title:
					step.floor === 1 && step.toFloor === 5
						? "Перейди в школу через переход"
						: step.floor === 5 && step.toFloor === 1
							? "Перейди в МИДИС через переход"
							: direction === "up"
								? `Поднимись на ${floorLabel} этаж`
								: `Спустись на ${floorLabel} этаж`,
			})

			lastPointIndex++
		}
	}

	const lastStep = points[lastPointIndex]

	steps.push({
		icon: "location-map-outline-24",
		title: "Дойди до точки",
		x: lastStep?.x ?? 0,
		y: lastStep?.y ?? 0,
		floor: lastStep?.floor ?? 0,
	})

	return steps
}

export const RouteNavigation = () => {
	const mapData = useMapData()

	const { start, end, isActive, resetRoute } = useRouteBuilder()

	const setActiveFloor = useActiveFloor((state) => state.setActiveFloor)
	const moveTo = useMapState((state) => state.moveTo)

	const [currentStep, setCurrentStep] = useState(0)

	const { data } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input: start && end && isActive ? { start, end } : skipToken,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: moveTo and setActiveFloor are dependencies of useEffect
	useEffect(() => {
		if (!isActive) return

		setCurrentStep(0)

		const step = steps[0]

		if (step) {
			setActiveFloor(step.floor)
			moveTo(step.x, step.y)
		}
	}, [steps, isActive])

	return (
		<AnimatePresence>
			{isActive && (
				<motion.div
					initial={{ y: "100%" }}
					animate={{ y: 0 }}
					exit={{ y: "100%" }}
					transition={TRANSITION}
					className="absolute bottom-0 left-0 right-0 bg-background border-t border-border rounded-3xl p-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)] flex flex-col gap-4"
				>
					{steps.length > 0 && (
						<>
							<div className="text-lg font-medium">
								{steps[currentStep].title}
							</div>
							<div className="flex gap-2">
								<StepIcon name="location-24" />
								{steps.map((step, i) => (
									<Touchable key={i}>
										<button
											type="button"
											className="flex gap-2 flex-1 items-center"
											onClick={() => {
												setCurrentStep(i)
												setActiveFloor(step.floor)
												moveTo(step.x, step.y)
											}}
										>
											<div
												className={cn(
													"h-1 flex-1 bg-border rounded-full transition-colors",
													i === currentStep && "bg-accent",
												)}
											/>
											<StepIcon name={step.icon} isActive={i === currentStep} />
										</button>
									</Touchable>
								))}
							</div>
						</>
					)}
					<Button
						variant="secondary"
						leftIcon="done-24"
						label="Завершить навигацию"
						onClick={() => {
							setCurrentStep(0)
							resetRoute()
						}}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
