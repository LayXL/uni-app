"use client"

import type { ClassValue } from "clsx"
import { useEffect, useRef, useState } from "react"

import { cn } from "../utils/cn"
import { isVK } from "../utils/is-vk"
import { BackButton } from "./back-button"

type PageTitleProps = {
	title: string
	titleClassName?: ClassValue
}

export function PageTitle({ title, titleClassName }: PageTitleProps) {
	const titleRef = useRef<HTMLDivElement | null>(null)
	const [isStickyVisible, setIsStickyVisible] = useState(false)
	const showBackButton = isVK()

	useEffect(() => {
		const titleElement = titleRef.current
		if (!titleElement) {
			return
		}

		const observer = new IntersectionObserver(
			([entry]) => setIsStickyVisible(!entry.isIntersecting),
			{ threshold: 0 },
		)

		observer.observe(titleElement)

		return () => observer.disconnect()
	}, [])

	return (
		<>
			<div ref={titleRef} className="relative mb-4">
				{showBackButton && (
					<div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
						<BackButton />
					</div>
				)}
				<div className="flex min-h-8 items-center justify-center">
					<h1 className={cn("text-xl font-bold text-center", titleClassName)}>
						{title}
					</h1>
				</div>
			</div>

			<div
				className={cn(
					"fixed left-0 right-0 top-0 z-50 px-4 pt-[calc(var(--tg-viewport-safe-area-inset-top,0px)+1rem)] pb-4 bg-linear-to-b [--tw-gradient-from-position:var(--tg-viewport-safe-area-inset-top,0px)] from-background to-transparent transition-all duration-300",
					isStickyVisible
						? "opacity-100 translate-y-0 pointer-events-auto"
						: "opacity-0 -translate-y-full pointer-events-none",
				)}
			>
				<div className="relative">
					{showBackButton && (
						<div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
							<BackButton />
						</div>
					)}
					<div className="flex min-h-8 items-center justify-center">
						<h1 className={cn("text-xl font-bold text-center", titleClassName)}>
							{title}
						</h1>
					</div>
				</div>
			</div>
		</>
	)
}
