import type { z } from "zod"

import type { routeSchema } from "@repo/orpc/routes/map/build-route"
import type { BuildingScheme } from "@repo/shared/building-scheme"

import { formatNavigationText } from "./format-navigation-text"

type Step = {
	title: string
	x: number
	y: number
	floor: number
}

export const buildSteps = (
	route: z.infer<typeof routeSchema>,
	data: BuildingScheme,
) => {
	const steps: Step[] = []

	if (route.length === 0) return steps

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
	let followsSchoolPassage = false

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

			const navigationStep = {
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
			}

			if (
				followsSchoolPassage &&
				step.floor === 5 &&
				(step.toFloor === 4 || step.toFloor === 6)
			) {
				steps[steps.length - 1].title +=
					` и ${navigationStep.title.toLowerCase()}`
			} else {
				steps.push(navigationStep)
			}

			followsSchoolPassage = step.floor === 1 && step.toFloor === 5
			lastPointIndex++
		}
	}

	const lastStep = points[lastPointIndex]

	steps.push({
		title: "Дойди до точки",
		x: lastStep?.x ?? 0,
		y: lastStep?.y ?? 0,
		floor: lastStep?.floor ?? 0,
	})

	return steps.map((step) => ({
		...step,
		title: formatNavigationText(step.title),
	}))
}
