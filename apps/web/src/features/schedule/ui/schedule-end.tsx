"use client"

import { useInView } from "motion/react"
import { useRef } from "react"

import { LottiePlayer } from "@/shared/ui/lottie"

export const ScheduleEnd = () => {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { once: true, amount: 0.5 })

	return (
		<div ref={ref} className="flex flex-col items-center px-4 py-8 text-center">
			<div className="mb-3 size-28">
				{isInView && <LottiePlayer src="schedule-end" className="size-28" />}
			</div>
			<h2 className="text-lg font-semibold">Вы долистали до конца</h2>
			<p className="mt-1 text-sm text-muted">Здесь могла быть ваша реклама</p>
		</div>
	)
}
