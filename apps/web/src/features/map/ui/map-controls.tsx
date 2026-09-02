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
	return (
		<div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-3">
			<div className="pointer-events-auto">
				<FloorControls
					activeFloor={activeFloor}
					onChangeFloor={onChangeFloor}
				/>
			</div>

			<div className="pointer-events-auto">
				<PositionControls
					zoomByStep={zoomByStep}
					rotation={rotation}
					resetRotation={resetRotation}
				/>
			</div>
		</div>
	)
}
