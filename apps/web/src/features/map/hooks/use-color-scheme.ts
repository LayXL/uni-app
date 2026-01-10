import { useEffect, useState } from "react"

export const useColorScheme = () => {
	const [colorScheme, setColorScheme] = useState<"light" | "dark">("light")

	useEffect(() => {
		const updateColorScheme = () => {
			const isDark = document.documentElement.classList.contains("dark")
			setColorScheme(isDark ? "dark" : "light")
		}

		// Initial check
		updateColorScheme()

		// Listen for class changes on document element
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (
					mutation.type === "attributes" &&
					mutation.attributeName === "class"
				) {
					updateColorScheme()
				}
			}
		})

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		})

		// Also listen for prefers-color-scheme changes
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
		const handleMediaChange = () => updateColorScheme()

		mediaQuery.addEventListener("change", handleMediaChange)

		return () => {
			observer.disconnect()
			mediaQuery.removeEventListener("change", handleMediaChange)
		}
	}, [])

	return colorScheme
}
