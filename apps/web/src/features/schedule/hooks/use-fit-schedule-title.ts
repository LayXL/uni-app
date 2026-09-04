import { type RefObject, useLayoutEffect } from "react"

export const useFitScheduleTitle = (
	textRef: RefObject<HTMLSpanElement | null>,
	text: string,
) => {
	useLayoutEffect(() => {
		const element = textRef.current
		const container = element?.parentElement
		if (!element || !container || !text) return

		let disposed = false
		let previousWidth = -1
		const fit = () => {
			if (disposed || container.clientWidth === 0) return

			element.style.removeProperty("font-size")
			const maxSize = Number.parseFloat(getComputedStyle(element).fontSize)
			const minSize = Math.min(14, maxSize)
			// Measure the full text within the 64px header, leaving room above/below.
			element.style.display = "inline-block"
			for (let size = maxSize; size >= minSize; size -= 1) {
				element.style.fontSize = `${size}px`
				if (
					element.scrollHeight <= 52 &&
					element.scrollWidth <= element.clientWidth
				)
					break
			}
			element.style.removeProperty("display")
		}

		fit()
		const observer = new ResizeObserver(([entry]) => {
			if (!entry || entry.contentRect.width === previousWidth) return
			previousWidth = entry.contentRect.width
			fit()
		})
		observer.observe(container)
		void document.fonts.ready.then(fit)
		return () => {
			disposed = true
			observer.disconnect()
		}
	}, [textRef, text])
}
