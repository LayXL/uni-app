import { motion } from "motion/react"

import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

type PositionControlsProps = {
	zoomByStep: (deltaZoom: number) => void
	rotation: number
	resetRotation: () => void
}

export const PositionControls = ({
	zoomByStep,
	rotation,
	resetRotation,
}: PositionControlsProps) => {
	return (
		<div className="bg-background border border-border flex flex-col gap-2 rounded-3xl">
			<Touchable>
				<button
					type="button"
					className="size-8 text-lg grid place-items-center rounded-3xl bg-background"
					onClick={() => zoomByStep(1.2)}
				>
					<Icon name="add-16" />
				</button>
			</Touchable>
			<Touchable>
				<button
					type="button"
					className="size-8 text-lg grid place-items-center rounded-3xl bg-background"
					onClick={() => zoomByStep(1 / 1.2)}
				>
					<Icon name="minus-16" />
				</button>
			</Touchable>
			{rotation !== 0 && (
				<Touchable>
					<button
						type="button"
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
