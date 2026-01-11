import { AnimatePresence, motion, type Transition } from "motion/react"
import type { ReactNode } from "react"

import { useDisableScroll } from "../hooks/use-disable-scroll"
import { Icon } from "./icon"
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
}

export const ModalRoot = ({
	children,
	isOpen,
	className,
	onClose,
	close,
	showCloseButton = true,
	fullHeight = false,
}: ModalRootProps) => {
	const handleClose = onClose ?? close ?? (() => {})

	useDisableScroll(isOpen)
	usePopupClose(isOpen, handleClose)

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<div className="fixed inset-0 z-50">
						<motion.div
							animate={{ opacity: 1 }}
							className="absolute inset-0 bg-black/60"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							onClick={handleClose}
							transition={TRANSITION}
						/>
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className={`absolute left-0 right-0 bottom-0 bg-background border-t border-border rounded-3xl p-4 pb-[calc(var(--safe-area-inset-bottom)+1rem)] ${fullHeight ? "h-dvh" : ""}`}
							exit={{ opacity: 0, y: "100%" }}
							initial={{ opacity: 0, y: "100%" }}
							transition={TRANSITION}
						>
							{showCloseButton && (
								<div className="absolute top-4 right-4">
									<Touchable>
										<button
											type="button"
											className="cursor-pointer bg-card border border-border rounded-full p-1"
											onClick={handleClose}
										>
											<Icon name="cancel-24" className="icon-secondary" />
										</button>
									</Touchable>
								</div>
							)}
							<div className={className}>{children}</div>
						</motion.div>
					</div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
