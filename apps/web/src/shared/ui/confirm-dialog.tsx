"use client"

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react"

import { isVK } from "../utils/is-vk"
import { Button } from "./button"
import { ModalRoot } from "./modal-root"

type ConfirmDialogOptions = {
	title: string
	description?: string
	confirmLabel?: string
	cancelLabel?: string
	destructive?: boolean
}

type OpenConfirmDialogOptions = string | ConfirmDialogOptions
type ConfirmDialogContextValue = {
	confirm: (options: OpenConfirmDialogOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

const getConfirmDialogOptions = (
	options: OpenConfirmDialogOptions,
): ConfirmDialogOptions => {
	if (typeof options === "string") {
		return { title: options }
	}

	return options
}

export const DialogProvider = ({ children }: { children: ReactNode }) => {
	const [options, setOptions] = useState<ConfirmDialogOptions | null>(null)
	const resolveRef = useRef<((value: boolean) => void) | null>(null)

	const close = useCallback((confirmed: boolean) => {
		resolveRef.current?.(confirmed)
		resolveRef.current = null
		setOptions(null)
	}, [])

	const confirm = useCallback((nextOptions: OpenConfirmDialogOptions) => {
		const normalizedOptions = getConfirmDialogOptions(nextOptions)

		if (!isVK()) {
			return Promise.resolve(window.confirm(normalizedOptions.title))
		}

		resolveRef.current?.(false)

		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve
			setOptions(normalizedOptions)
		})
	}, [])

	useEffect(() => {
		return () => resolveRef.current?.(false)
	}, [])

	return (
		<ConfirmDialogContext.Provider value={{ confirm }}>
			{children}
			<ModalRoot
				isOpen={options !== null}
				onClose={() => close(false)}
				showCloseButton={false}
				className="flex flex-col gap-5"
			>
				<div className="flex flex-col gap-2 text-center">
					<h2 className="text-lg font-semibold">{options?.title}</h2>
					{options?.description && (
						<p className="text-sm text-muted">{options.description}</p>
					)}
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="secondary"
						label={options?.cancelLabel ?? "Отмена"}
						onClick={() => close(false)}
					/>
					<Button
						variant="secondary"
						label={options?.confirmLabel ?? "Подтвердить"}
						onClick={() => close(true)}
						className={options?.destructive && "text-destructive"}
					/>
				</div>
			</ModalRoot>
		</ConfirmDialogContext.Provider>
	)
}

export const useConfirmDialog = () => {
	const context = useContext(ConfirmDialogContext)

	if (!context) {
		throw new Error("useConfirmDialog must be used within DialogProvider")
	}

	return context.confirm
}
