import { motion, useScroll, useTransform } from "motion/react"

import { useViewportDimensions } from "@/shared/hooks/use-viewport-dimensions"

import { FloorControls } from "./floor-control"
import { PositionControls } from "./position-controls"

type MapControlsProps = {
	activeFloor: number
	onChangeFloor: (floorId: number) => void
	zoomByStep: (deltaZoom: number) => void
	rotation: number
	resetRotation: () => void
}

export const MapControls = ({
	activeFloor,
	onChangeFloor,
	zoomByStep,
	rotation,
	resetRotation,
}: MapControlsProps) => {
	const { scrollY } = useScroll()

	const { height } = useViewportDimensions()
	const heightSafe = Math.max(height, 1)

	const value = useTransform(scrollY, [0, heightSafe], [0, 1])

	const y = useTransform(value, [0, 0.6], ["-50vh", "-100vh"])
	const opacity = useTransform(value, [0.3, 0.4], [1, 0])
	const pointerEvents = useTransform(value, [0.3, 0.38], ["auto", "none"])

	return (
		<motion.div
			className="absolute w-full px-3 flex justify-between items-center pointer-events-none"
			style={{ y, opacity }}
		>
			<motion.div style={{ pointerEvents }}>
				<FloorControls
					activeFloor={activeFloor}
					onChangeFloor={onChangeFloor}
				/>
			</motion.div>

			<motion.div style={{ pointerEvents }}>
				<PositionControls
					zoomByStep={zoomByStep}
					rotation={rotation}
					resetRotation={resetRotation}
				/>
			</motion.div>
		</motion.div>
	)
}
