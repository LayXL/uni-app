import { motion } from "motion/react"

import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

import { ViewModeIcon } from "./view-mode-icon"

type PositionControlsProps = {
	rotation?: number
	resetRotation?: () => void
	view?: "3d" | "top"
	onToggleView?: () => void
}

export const PositionControls = ({
	rotation = 0,
	resetRotation,
	view,
	onToggleView,
}: PositionControlsProps) => {
	if (!onToggleView && (rotation === 0 || !resetRotation)) return null

	return (
		<div className="bg-background border border-border flex flex-col gap-2 rounded-3xl">
			{onToggleView && (
				<Touchable>
					<button
						type="button"
						aria-label={view === "3d" ? "Переключить в 2D" : "Переключить в 3D"}
						title={view === "3d" ? "Переключить в 2D" : "Переключить в 3D"}
						aria-pressed={view === "3d"}
						className="size-11 grid place-items-center rounded-3xl bg-background"
						onClick={onToggleView}
					>
						<ViewModeIcon view={view} />
					</button>
				</Touchable>
			)}
			{!onToggleView && rotation !== 0 && (
				<Touchable>
					<button
						type="button"
						aria-label="Сбросить поворот карты"
						className="size-11 text-lg grid place-items-center rounded-3xl bg-background"
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
