import type { Transition } from "motion/react"
import { type ReactNode, useEffect, useState } from "react"

import { useDisableScroll } from "../hooks/use-disable-scroll"
import { cn } from "../utils/cn"
import { Icon } from "./icon"
import { LiquidBorder } from "./liquid-border"
import { usePopupClose } from "./popup"
import { Portal } from "./portal"
import { Touchable } from "./touchable"

export const TRANSITION = {
	ease: [0.25, 0.1, 0.25, 1],
	duration: 0.3,
} as const satisfies Transition

type ModalRootProps = {
	children: ReactNode
	isOpen: boolean
	onClose?: () => void
	close?: () => void
	className?: string
	showCloseButton?: boolean
	fullHeight?: boolean
	hideBackdrop?: boolean
}

export const ModalRoot = ({
	children,
	isOpen,
	className,
	onClose,
	close,
	showCloseButton = true,
	fullHeight = false,
	hideBackdrop = false,
}: ModalRootProps) => {
	const handleClose = onClose ?? close ?? (() => {})
	const [shouldRender, setShouldRender] = useState(isOpen)
	const [isAnimating, setIsAnimating] = useState(false)

	useEffect(() => {
		if (isOpen) {
			setShouldRender(true)
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setIsAnimating(true)
				})
			})
		} else {
			setIsAnimating(false)
			const timer = setTimeout(() => {
				setShouldRender(false)
			}, 300)
			return () => clearTimeout(timer)
		}
	}, [isOpen])

	useDisableScroll(isOpen)
	usePopupClose(isOpen, handleClose)

	if (!shouldRender) return null

	return (
		<Portal>
			<div className="fixed inset-0 z-50">
				{!hideBackdrop && (
					<div
						role="button"
						tabIndex={-1}
						className={cn(
							"absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out",
							isAnimating ? "opacity-100" : "opacity-0",
						)}
						onClick={handleClose}
					/>
				)}
				<div
					className={cn(
						"absolute left-0 right-0 bottom-0 bg-background border-t border-border rounded-t-3xl p-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)] transition-transform duration-300 ease-out",
						isAnimating ? "translate-y-0" : "translate-y-full",
						fullHeight && "h-dvh",
					)}
				>
					{showCloseButton && (
						<div className="absolute top-4 right-4">
							<Touchable>
								<button
									type="button"
									className="relative bg-card rounded-full p-1"
									onClick={handleClose}
								>
									<LiquidBorder />
									<Icon name="cancel-24" className="icon-secondary" />
								</button>
							</Touchable>
						</div>
					)}
					<div className={className}>{children}</div>
				</div>
			</div>
		</Portal>
	)
}
