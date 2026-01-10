import { motion } from "motion/react"

import { Icon } from "@/shared/ui/icon"

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
		<div className="absolute mt-(--tg-content-safe-area-inset-top) top-2 right-2 bg-card border-border flex flex-col gap-2 rounded-lg">
			<button
				type="button"
				className="size-8 text-lg grid place-items-center rounded-lg"
				onClick={() => zoomByStep(1.2)}
			>
				<Icon name="add-16" />
			</button>
			<button
				type="button"
				className="size-8 text-lg grid place-items-center rounded-lg"
				onClick={() => zoomByStep(1 / 1.2)}
			>
				<Icon name="minus-16" />
			</button>
			{rotation !== 0 && (
				<button
					type="button"
					className="size-8 text-lg grid place-items-center rounded-lg"
					onClick={resetRotation}
				>
					<motion.span
						initial={{ rotate: (rotation * 180 - 140) / Math.PI }}
						animate={{ rotate: (rotation * 180 - 140) / Math.PI }}
					>
						<Icon name="compass-24" size={16} />
					</motion.span>
				</button>
			)}
		</div>
	)
}
