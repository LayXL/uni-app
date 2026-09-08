import { cn } from "@/shared/utils/cn"

import { FloorControls } from "./floor-control"
import { PositionControls } from "./position-controls"

type MapControlsProps = {
	hidden?: boolean
	activeFloor: number
	onChangeFloor: (floorId: number) => void
	rotation?: number
	resetRotation?: () => void
	view?: "3d" | "top"
	onToggleView?: () => void
}

export const MapControls = ({
	hidden = false,
	activeFloor,
	onChangeFloor,
	rotation = 0,
	resetRotation,
	view,
	onToggleView,
}: MapControlsProps) => {
	return (
		<div
			inert={hidden}
			className={cn(
				"pointer-events-none absolute left-[max(0.75rem,var(--safe-area-inset-left,0px))] right-[max(0.75rem,var(--safe-area-inset-right,0px))] top-[calc(var(--safe-area-inset-top,0px)+0.75rem)] flex items-start justify-between transition-opacity duration-300 ease-in-out motion-reduce:transition-none",
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
					rotation={rotation}
					resetRotation={resetRotation}
					view={view}
					onToggleView={onToggleView}
				/>
			</div>
		</div>
	)
}
