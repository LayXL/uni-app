import { useEffect } from "react"

let count = 0

export const useDisableScroll = (disabled = true) => {
	useEffect(() => {
		if (!disabled) return

		count++
		document.body.style.overflow = "hidden"

		return () => {
			count--
			if (count === 0) {
				document.body.style.overflow = ""
			}
		}
	}, [disabled])
}
