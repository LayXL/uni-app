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
	const [stickyHeight, setStickyHeight] = useState<number | null>(null)
	const showBackButton = isVK()

	useEffect(() => {
		const titleElement = titleRef.current
		if (!titleElement) {
			return
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				setIsStickyVisible(!entry.isIntersecting)

				const height = Number(
					document.body.style.getPropertyValue(
						"--tg-viewport-content-safe-area-inset-top",
					),
				)

				if (height) {
					setStickyHeight(height)
				}
			},
			{ threshold: 0 },
		)

		observer.observe(titleElement)

		return () => observer.disconnect()
	}, [])

	const content = (
		<>
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
		</>
	)

	return (
		<>
			<div ref={titleRef} className="relative mb-4">
				{content}
			</div>

			{isStickyVisible && (
				<div
					className={cn(
						"fixed left-0 right-0 top-0 z-50",
						"[--from:var(--background)] [--via:color-mix(in_srgb,var(--background)_95%,transparent)] [--to:transparent]",
						stickyHeight
							? "bg-linear-[180deg,var(--from),var(--via)_var(--tg-viewport-safe-area-inset-top),var(--to)] pt-(--tg-viewport-safe-area-inset-top)"
							: "p-4 bg-linear-to-b from-background to-transparent",
					)}
					style={{ height: stickyHeight ? `${stickyHeight}px` : undefined }}
				>
					{content}
				</div>
			)}
		</>
	)
}
