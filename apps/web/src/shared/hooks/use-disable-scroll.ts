import { useEffect } from "react"

export const useDisableScroll = (disabled = true) => {
	useEffect(() => {
		if (disabled) {
			document.body.style.overflow = "hidden"
		} else {
			document.body.style.overflow = "auto"
		}
		return () => {
			document.body.style.overflow = "auto"
		}
	}, [disabled])
}
