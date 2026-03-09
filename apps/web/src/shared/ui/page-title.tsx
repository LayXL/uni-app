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
			<div ref={titleRef} className="flex items-center gap-2 mb-4">
				{isVK() && <BackButton />}
				<h1 className={cn("text-xl font-bold", titleClassName)}>{title}</h1>
			</div>

			<div
				className={cn(
					"fixed left-0 right-0 top-0 z-50 px-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-4 bg-linear-to-b [--tw-gradient-from-position:var(--safe-area-inset-top)] from-background to-transparent transition-all duration-300",
					isStickyVisible
						? "opacity-100 translate-y-0 pointer-events-auto"
						: "opacity-0 -translate-y-full pointer-events-none",
				)}
			>
				<div className="flex items-center gap-2">
					{isVK() && <BackButton />}
					<h1 className={cn("text-xl font-bold", titleClassName)}>{title}</h1>
				</div>
			</div>
		</>
	)
}
