"use client"

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react"

type PopupStackItem = {
	id: string
	close: () => void
}

type PopupContextValue = {
	register: (id: string, close: () => void) => void
	unregister: (id: string) => void
	closeTop: () => boolean
	subscribe: (callback: () => void) => () => void
	getSnapshot: () => number
}

const PopupContext = createContext<PopupContextValue | null>(null)

export const PopupProvider = ({ children }: { children: ReactNode }) => {
	const stackRef = useRef<PopupStackItem[]>([])
	const listenersRef = useRef<Set<() => void>>(new Set())

	const notify = useCallback(() => {
		for (const listener of listenersRef.current) {
			listener()
		}
	}, [])

	const register = useCallback(
		(id: string, close: () => void) => {
			stackRef.current = stackRef.current.filter((item) => item.id !== id)
			stackRef.current.push({ id, close })
			notify()
		},
		[notify],
	)

	const unregister = useCallback(
		(id: string) => {
			stackRef.current = stackRef.current.filter((item) => item.id !== id)
			notify()
		},
		[notify],
	)

	const closeTop = useCallback(() => {
		if (stackRef.current.length === 0) return false

		const topPopup = stackRef.current[stackRef.current.length - 1]
		topPopup?.close()
		return true
	}, [])

	const subscribe = useCallback((callback: () => void) => {
		listenersRef.current.add(callback)
		return () => listenersRef.current.delete(callback)
	}, [])

	const getSnapshot = useCallback(() => stackRef.current.length, [])

	const value = useMemo(
		() => ({ register, unregister, closeTop, subscribe, getSnapshot }),
		[register, unregister, closeTop, subscribe, getSnapshot],
	)

	return <PopupContext.Provider value={value}>{children}</PopupContext.Provider>
}

/**
 * Hook to get the current popup stack count.
 * Useful for showing/hiding back button based on open popups.
 */
export const usePopupStackCount = () => {
	const context = useContext(PopupContext)

	return useSyncExternalStore(
		context?.subscribe ?? (() => () => {}),
		context?.getSnapshot ?? (() => 0),
		() => 0,
	)
}

/**
 * Hook to get the closeTop function from popup context.
 * Returns a function that closes the topmost popup and returns true,
 * or returns false if no popups are open.
 */
export const usePopupCloseTop = () => {
	const context = useContext(PopupContext)
	return context?.closeTop ?? (() => false)
}

/**
 * Hook to register a popup in the stack for back button handling.
 * When back button is pressed, only the topmost popup gets closed.
 *
 * @param isOpen - Whether the popup is currently open
 * @param onClose - Function to call when the popup should be closed
 */
export const usePopupClose = (isOpen: boolean, onClose: () => void) => {
	const context = useContext(PopupContext)
	const id = useId()
	const onCloseRef = useRef(onClose)

	useEffect(() => {
		onCloseRef.current = onClose
	}, [onClose])

	useEffect(() => {
		if (!context || !isOpen) return

		const close = () => onCloseRef.current()

		context.register(id, close)
		return () => context.unregister(id)
	}, [isOpen, id, context])
}
