import { Popover } from "@base-ui/react/popover"
import type { RefObject } from "react"

import { Button } from "@/shared/ui/button"
import { usePopupClose } from "@/shared/ui/popup"

export type ScheduleSettingsHintState = {
	visible: boolean
	isSaving: boolean
	error: boolean
	dismiss: () => void
}

export const ScheduleSettingsHint = ({
	anchor,
	hint,
	open,
	onClose,
}: {
	anchor: RefObject<HTMLButtonElement | null>
	hint: ScheduleSettingsHintState
	open: boolean
	onClose: () => void
}) => {
	usePopupClose(open, onClose)
	return (
		<Popover.Root
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) onClose()
			}}
		>
			<Popover.Portal>
				<Popover.Positioner
					anchor={anchor}
					side="bottom"
					align="end"
					sideOffset={12}
					arrowPadding={12}
					collisionPadding={12}
					className="z-50"
				>
					<Popover.Popup
						initialFocus={false}
						finalFocus={false}
						className="relative w-max max-w-[calc(100vw-1.5rem)] origin-(--transform-origin) rounded-xl bg-card p-3 ring-1 ring-border drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition-[opacity,transform] duration-200 data-starting-style:translate-y-1 data-starting-style:opacity-0 data-ending-style:opacity-0"
					>
						<Popover.Arrow className="data-[side=bottom]:-top-[8.5px] data-[side=top]:-bottom-[8.5px] data-[side=top]:rotate-180">
							<svg
								width="16"
								height="10"
								viewBox="0 0 16 10"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M0 8 6.6 1.4Q8 0 9.4 1.4L16 8V10H0Z"
									className="fill-card"
								/>
								<path
									d="M0 8 6.6 1.4Q8 0 9.4 1.4L16 8"
									className="stroke-border"
								/>
							</svg>
						</Popover.Arrow>
						<Popover.Title className="mb-2 whitespace-nowrap text-base font-semibold">
							Настрой расписание под себя
						</Popover.Title>
						<Button
							label="Хорошо"
							size="sm"
							onClick={hint.dismiss}
							disabled={hint.isSaving}
							className="w-full"
						/>
						{hint.error && (
							<p role="alert" className="mt-2 text-sm text-destructive">
								Не удалось сохранить. Попробуйте ещё раз.
							</p>
						)}
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	)
}
