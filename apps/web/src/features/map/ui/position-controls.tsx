import { motion } from "motion/react"

import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

type PositionControlsProps = {
	zoomByStep: (deltaZoom: number) => void
	rotation?: number
	resetRotation?: () => void
	view?: "3d" | "top"
	onToggleView?: () => void
}

export const PositionControls = ({
	zoomByStep,
	rotation = 0,
	resetRotation,
	view,
	onToggleView,
}: PositionControlsProps) => {
	return (
		<div className="bg-background border border-border flex flex-col gap-2 rounded-3xl">
			<Touchable>
				<button
					type="button"
					aria-label="Приблизить карту"
					className="size-8 text-lg grid place-items-center rounded-3xl bg-background"
					onClick={() => zoomByStep(1.2)}
				>
					<Icon name="add-16" />
				</button>
			</Touchable>
			<Touchable>
				<button
					type="button"
					aria-label="Отдалить карту"
					className="size-8 text-lg grid place-items-center rounded-3xl bg-background"
					onClick={() => zoomByStep(1 / 1.2)}
				>
					<Icon name="minus-16" />
				</button>
			</Touchable>
			{onToggleView && (
				<Touchable>
					<button
						type="button"
						aria-label={view === "3d" ? "Переключить в 2D" : "Переключить в 3D"}
						title={view === "3d" ? "Переключить в 2D" : "Переключить в 3D"}
						aria-pressed={view === "3d"}
						className="size-8 grid place-items-center rounded-3xl bg-background"
						onClick={onToggleView}
					>
						<Icon
							name={
								view === "3d"
									? "iconify:material-symbols:2d-outline"
									: "iconify:material-symbols:3d-outline"
							}
							size={24}
						/>
					</button>
				</Touchable>
			)}
			{!onToggleView && rotation !== 0 && (
				<Touchable>
					<button
						type="button"
						aria-label="Сбросить поворот карты"
						className="size-8 text-lg grid place-items-center rounded-3xl bg-background"
						onClick={resetRotation}
					>
						<motion.span
							initial={{ rotate: (rotation * 180 - 140) / Math.PI }}
							animate={{ rotate: (rotation * 180 - 140) / Math.PI }}
						>
							<Icon name="compass-24" size={16} />
						</motion.span>
					</button>
				</Touchable>
			)}
		</div>
	)
}
