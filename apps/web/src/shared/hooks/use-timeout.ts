import { useEffect, useRef } from "react"

/**
 * A hook that handles setTimeout in a declarative way.
 *
 * @param callback The function to be called after the delay.
 * @param delay The delay in milliseconds. If null, the timeout is cleared.
 */
export const useTimeout = (callback: () => void, delay: number | null) => {
	const savedCallback = useRef(callback)

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// Set up the timeout.
	useEffect(() => {
		if (delay !== null) {
			const id = setTimeout(() => savedCallback.current(), delay)
			return () => clearTimeout(id)
		}
	}, [delay])
}
