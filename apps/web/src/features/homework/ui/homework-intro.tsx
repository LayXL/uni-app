"use client"

import { useReducedMotion } from "motion/react"

import { LottiePlayer } from "@/shared/ui/lottie"

export function HomeworkIntro() {
	const reducedMotion = useReducedMotion()

	return (
		<header className="mb-6 flex flex-col items-center gap-2 text-center">
			<LottiePlayer
				src="homework-add"
				className="size-28"
				autoplay={!reducedMotion}
				disableFadeIn
			/>
			<div className="flex max-w-sm flex-col gap-1">
				<h1 className="text-xl font-bold">Запиши домашку</h1>
				<p className="text-sm text-muted text-balance">
					Добавь задание и дедлайн, чтобы всё было под рукой
				</p>
			</div>
		</header>
	)
}
