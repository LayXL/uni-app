"use client"

import { skipToken, useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import type { z } from "zod"

import { orpc } from "@repo/orpc/react"
import type { routeSchema } from "@repo/orpc/routes/map/build-route"

import { useRouteBuilder } from "@/features/map/hooks/use-route-builder"
import { useDisableScroll } from "@/shared/hooks/use-disable-scroll"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { TRANSITION } from "@/shared/ui/modal-root"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"
import type { IconName } from "@/types/icon-name"

import { useActiveFloor } from "../hooks/use-active-floor"
import { useMapState } from "../hooks/use-map-state"

type StepIconProps = {
	name: IconName
	isActive?: boolean
}

const StepIcon = ({ name, isActive }: StepIconProps) => {
	return (
		<div
			className={cn(
				"size-12 grid place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors",
				isActive && "bg-primary text-primary-foreground",
			)}
		>
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

const buildSteps = (route: z.infer<typeof routeSchema>) => {
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

			steps.push({
				icon: "stairs",
				x: points[lastPointIndex].x,
				y: points[lastPointIndex].y,
				floor: points[lastPointIndex].floor,
				title:
					direction === "up"
						? `Поднимись на ${step.toFloor} этаж`
						: `Спустись на ${step.toFloor} этаж`,
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
	const { start, end, hasPoints, isActive, resetRoute } = useRouteBuilder()

	const setActiveFloor = useActiveFloor((state) => state.setActiveFloor)
	const moveTo = useMapState((state) => state.moveTo)

	const [currentStep, setCurrentStep] = useState(0)

	const { data } = useQuery(
		orpc.map.buildRoute.queryOptions({
			input: start && end && isActive ? { start, end } : skipToken,
		}),
	)

	useDisableScroll(hasPoints)

	useEffect(() => {
		if (hasPoints) {
			window.scrollTo({ top: 0, behavior: "smooth" })
		}
	}, [hasPoints])

	const steps = useMemo(() => buildSteps(data?.route ?? []), [data?.route])

	// biome-ignore lint/correctness/useExhaustiveDependencies: moveTo and setActiveFloor are dependencies of useEffect
	useEffect(() => {
		setCurrentStep(0)

		const step = steps[0]

		if (step) {
			setActiveFloor(step.floor)
			moveTo(step.x, step.y)
		}
	}, [steps])

	return (
		<AnimatePresence>
			{hasPoints && (
				<motion.div
					initial={{ y: "100%" }}
					animate={{ y: 0 }}
					exit={{ y: "100%" }}
					transition={TRANSITION}
					className="absolute bottom-1 left-1 right-1 bg-background border border-border rounded-3xl p-4 flex flex-col gap-4"
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
													i === currentStep && "bg-primary",
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
						onClick={resetRoute}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
