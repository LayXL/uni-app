type Position = { x: number; y: number }

type CursorPositionDebugProps = {
	cursorCoords: { screen: Position; world: Position }
}

export const CursorPositionDebug = ({
	cursorCoords,
}: CursorPositionDebugProps) => {
	const { screen, world } = cursorCoords

	return (
		<div
			className="pointer-events-none absolute rounded-md bg-neutral-900/80 px-2 py-1 text-xs text-white shadow"
			style={{ left: screen.x + 10, top: screen.y + 10 }}
		>
			<div>
				{world.x.toFixed(0)}, {world.y.toFixed(0)}
			</div>
		</div>
	)
}
