import { type MotionValue, motion, useTransform } from "motion/react"
import { useCallback, useSyncExternalStore } from "react"

import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

type PositionControlsProps = {
	rotation?: number | MotionValue<number>
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
	const subscribe = useCallback(
		(onChange: () => void) =>
			typeof rotation === "number" ? () => {} : rotation.on("change", onChange),
		[rotation],
	)
	const getIsRotated = useCallback(() => {
		const angle = typeof rotation === "number" ? rotation : rotation.get()
		return Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) > 0.001
	}, [rotation])
	const isRotated = useSyncExternalStore(subscribe, getIsRotated, getIsRotated)
	const compassRotation = useTransform(() => {
		const angle = typeof rotation === "number" ? rotation : rotation.get()
		return (angle * 180) / Math.PI - 45
	})
	if (!onToggleView && !resetRotation) return null

	return (
		<div
			className={cn(
				"t-acc bg-background border border-border flex flex-col rounded-3xl transition-opacity duration-(--acc-collapse) ease-(--acc-ease) motion-reduce:transition-none",
				!onToggleView && !isRotated && "opacity-0 pointer-events-none",
			)}
			data-open={isRotated}
		>
			{onToggleView && (
				<Touchable>
					<button
						type="button"
						aria-label={view === "3d" ? "Переключить в 2D" : "Переключить в 3D"}
						title={view === "3d" ? "Переключить в 2D" : "Переключить в 3D"}
						aria-pressed={view === "3d"}
						className="size-11 grid place-items-center rounded-3xl bg-background text-sm font-semibold"
						onClick={onToggleView}
					>
						{view === "3d" ? "2D" : "3D"}
					</button>
				</Touchable>
			)}
			{resetRotation && (
				<div
					className="t-acc-panel"
					inert={!isRotated}
					aria-hidden={!isRotated}
				>
					<div className="t-acc-panel-inner">
						<div className={onToggleView ? "pt-2" : undefined}>
							<Touchable>
								<button
									type="button"
									aria-label="Сбросить поворот карты"
									title="Сбросить поворот карты"
									className="size-11 text-lg grid place-items-center rounded-3xl bg-background"
									onClick={resetRotation}
								>
									<motion.span
										aria-hidden="true"
										style={{ rotate: compassRotation }}
									>
										<Icon name="compass-24" size={20} />
									</motion.span>
								</button>
							</Touchable>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
