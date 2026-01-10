import { motion } from "motion/react"

import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

type MapControlsProps = {
	zoomByStep: (deltaZoom: number) => void
	rotation: number
	resetRotation: () => void
}

export const MapControls = ({
	zoomByStep,
	rotation,
	resetRotation,
}: MapControlsProps) => {
	return (
		<div className="absolute top-1/2 -translate-y-1/2 right-3 bg-background border border-border flex flex-col gap-2 rounded-3xl">
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
