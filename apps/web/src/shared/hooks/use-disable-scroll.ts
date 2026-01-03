import { useEffect } from "react"

type UseDisableScrollParams = {
	disabled?: boolean
}

export const useDisableScroll = ({
	disabled = true,
}: UseDisableScrollParams) => {
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
