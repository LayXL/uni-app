"use client"

import type { ClassValue } from "clsx"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { useEffect, useRef, useState } from "react"

import { cn } from "../utils/cn"
import { haptic } from "../utils/haptic"

export type LottiePlayerProps = {
	src: string
	className?: ClassValue
	loop?: boolean
	autoplay?: boolean
	disableFadeIn?: boolean
}

export const LottiePlayer = ({
	src,
	className,
	loop = false,
	autoplay = true,
	disableFadeIn = false,
}: LottiePlayerProps) => {
	const [animationData, setAnimationData] = useState<unknown>(null)
	const [isComplete, setIsComplete] = useState(false)
	const lottieRef = useRef<LottieRefCurrentProps | null>(null)

	useEffect(() => {
		const controller = new AbortController()

		const loadAnimation = async () => {
			try {
				const response = await fetch(`/lottie/${src}.json`, {
					signal: controller.signal,
				})
				if (!response.ok) return

				const data = (await response.json()) as Record<string, unknown>
				setAnimationData(data)
			} catch {}
		}

		setIsComplete(false)
		loadAnimation()

		return () => {
			controller.abort()
		}
	}, [src])

	if (!animationData)
		return (
			<div
				className={cn("inline-flex p-0 bg-transparent border-0", className)}
			/>
		)

	return (
		<button
			type="button"
			className={cn(
				"inline-flex p-0 bg-transparent border-0",
				!disableFadeIn && "animate-fade-in",
				className,
			)}
			onClick={() => {
				if (!isComplete) return

				haptic("light")
				setIsComplete(false)
				lottieRef.current?.goToAndPlay(0, true)
			}}
		>
			<Lottie
				animationData={animationData}
				loop={loop}
				autoplay={autoplay}
				lottieRef={lottieRef}
				onComplete={() => {
					setIsComplete(true)
				}}
			/>
		</button>
	)
}
