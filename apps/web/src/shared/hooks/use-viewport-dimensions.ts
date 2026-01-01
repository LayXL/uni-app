import { useEffect, useState } from "react"

export function useViewportDimensions() {
	const [size, setSize] = useState({
		width: typeof window === "undefined" ? 0 : window.innerWidth,
		height: typeof window === "undefined" ? 0 : window.innerHeight,
	})

	useEffect(() => {
		function handleResize() {
			setSize({
				width: window.innerWidth,
				height: window.innerHeight,
			})
		}

		window.addEventListener("resize", handleResize)
		window.addEventListener("orientationchange", handleResize)
		handleResize()

		return () => {
			window.removeEventListener("resize", handleResize)
			window.removeEventListener("orientationchange", handleResize)
		}
	}, [])

	return size
}
