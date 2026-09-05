"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { useFitScheduleTitle } from "../hooks/use-fit-schedule-title"
import { useScheduleSplash } from "../hooks/use-schedule-splash"

import "./schedule-title.css"

export const ScheduleTitle = () => {
	const title = useScheduleSplash()
	const [displayTitle, setDisplayTitle] = useState(title)
	const textRef = useRef<HTMLSpanElement>(null)
	const shouldAnimateEntry = useRef(false)
	useFitScheduleTitle(textRef, displayTitle)

	useEffect(() => {
		const element = textRef.current
		if (!element || title === displayTitle) return

		if (
			title !== "Расписание" ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) {
			setDisplayTitle(title)
			return
		}

		const duration = Number.parseFloat(
			getComputedStyle(element).getPropertyValue("--text-swap-dur"),
		)
		element.classList.add("is-exit")
		const timeout = window.setTimeout(() => {
			shouldAnimateEntry.current = true
			setDisplayTitle(title)
		}, duration)
		return () => {
			window.clearTimeout(timeout)
			element.classList.remove("is-exit")
		}
	}, [title, displayTitle])

	useLayoutEffect(() => {
		const element = textRef.current
		if (
			!element ||
			displayTitle !== "Расписание" ||
			!shouldAnimateEntry.current
		)
			return
		shouldAnimateEntry.current = false
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

		element.classList.remove("is-exit")
		element.classList.add("is-enter-start")
		void element.offsetHeight
		element.classList.remove("is-enter-start")
	}, [displayTitle])

	return (
		<span
			ref={textRef}
			className="t-text-swap schedule-title-text"
			data-default-title={displayTitle === "Расписание" || undefined}
			title={displayTitle}
		>
			{displayTitle}
		</span>
	)
}
