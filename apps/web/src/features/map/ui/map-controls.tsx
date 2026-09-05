import { cn } from "@/shared/utils/cn"

import { FloorControls } from "./floor-control"
import { PositionControls } from "./position-controls"

type MapControlsProps = {
	hidden?: boolean
	activeFloor: number
	onChangeFloor: (floorId: number) => void
	zoomByStep: (deltaZoom: number) => void
	rotation?: number
	resetRotation?: () => void
	view?: "3d" | "top"
	onToggleView?: () => void
}

export const MapControls = ({
	hidden = false,
	activeFloor,
	onChangeFloor,
	zoomByStep,
	rotation = 0,
	resetRotation,
	view,
	onToggleView,
}: MapControlsProps) => {
	return (
		<div
			inert={hidden}
			className={cn(
				"pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-3 transition-opacity duration-300 ease-in-out motion-reduce:transition-none",
				hidden ? "opacity-0" : "opacity-100",
			)}
		>
			<div className={hidden ? "pointer-events-none" : "pointer-events-auto"}>
				<FloorControls
					activeFloor={activeFloor}
					onChangeFloor={onChangeFloor}
				/>
			</div>

			<div className={hidden ? "pointer-events-none" : "pointer-events-auto"}>
				<PositionControls
					zoomByStep={zoomByStep}
					rotation={rotation}
					resetRotation={resetRotation}
					view={view}
					onToggleView={onToggleView}
				/>
			</div>
		</div>
	)
}
