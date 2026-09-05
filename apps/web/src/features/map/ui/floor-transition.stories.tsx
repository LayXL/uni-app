import type { Meta, StoryObj } from "@storybook/react-vite"
import type * as fabric from "fabric"
import {
	type CSSProperties,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react"

import type { BuildingScheme } from "@repo/shared/building-scheme"

import scheme from "../../../../../../scripts/v3.json"
import { useFloorRender } from "../hooks/use-floor-render"
import { useFloorTransition } from "../hooks/use-floor-transition"
import { useMapCanvas } from "../hooks/use-map-canvas"
import { useMapViewport } from "../hooks/use-map-viewport"
import { collectBounds } from "../lib/geometry"

import "./floor-transition.css"

const mapData = scheme as BuildingScheme

const FloorTransitionPreview = ({
	slowMotion = false,
	reducedMotion = false,
}) => {
	const [activeFloor, setActiveFloor] = useState(0)
	const [ready, setReady] = useState(false)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fabricRef = useRef<fabric.Canvas | null>(null)
	const textObjectsRef = useRef<fabric.Text[]>([])
	const labelBaseSizeRef = useRef(new WeakMap<fabric.FabricText, number>())
	const iconObjectsRef = useRef<fabric.Object[]>([])
	const iconBaseScaleRef = useRef(new WeakMap<fabric.Object, number>())
	const refs = {
		fabricRef,
		textObjectsRef,
		labelBaseSizeRef,
		iconObjectsRef,
		iconBaseScaleRef,
	}
	const { viewportRef, applyViewport } = useMapViewport(refs)
	const transition = useFloorTransition({
		activeFloor,
		floors: mapData.floors,
		canvasRef,
		enabled: ready && !reducedMotion,
	})
	const centerFloor = useCallback(() => {
		const canvas = fabricRef.current
		const floor = mapData.floors.find((f) => f.id === activeFloor)
		if (!canvas || !floor) return
		const bounds = collectBounds(floor, mapData.entities)
		const zoom = Math.min(
			canvas.getWidth() / (bounds.maxX - bounds.minX + 384),
			canvas.getHeight() / (bounds.maxY - bounds.minY + 384),
		)
		applyViewport({
			zoom,
			rotation: 0,
			translateX:
				canvas.getWidth() / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom,
			translateY:
				canvas.getHeight() / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom,
		})
	}, [activeFloor, applyViewport])
	useMapCanvas({
		canvasRef,
		fabricRef,
		onInit: () => setReady(true),
		onResize: centerFloor,
	})
	useEffect(() => {
		if (ready) centerFloor()
	}, [centerFloor, ready])
	useFloorRender({
		...refs,
		data: mapData,
		activeFloor,
		viewportRef,
		isDebug: false,
		enabled: ready,
		onFloorReady: transition.onFloorReady,
	})

	return (
		<div className="p-6">
			<div className="mb-4 flex flex-wrap gap-2">
				{mapData.floors.map((floor) => (
					<button
						key={floor.id}
						type="button"
						className="rounded-xl border border-border px-3 py-2 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
						aria-pressed={activeFloor === floor.id}
						onClick={() => setActiveFloor(floor.id)}
					>
						{floor.name}
					</button>
				))}
			</div>
			<div className="relative h-[70vh] overflow-hidden rounded-2xl bg-(--map-background)">
				<div
					ref={transition.transitionRef}
					className="map-floor-transition t-page-slide"
					data-page="1"
					style={
						slowMotion
							? ({
									"--page-slide-dur": "2400ms",
									"--page-fade-dur": "2400ms",
								} as CSSProperties)
							: undefined
					}
				>
					<div
						ref={transition.liveLayerRef}
						className="t-page"
						data-page-id="1"
					>
						<canvas ref={canvasRef} className="size-full" />
					</div>
					<canvas
						ref={transition.snapshotRef}
						className="t-page"
						data-page-id="2"
						aria-hidden="true"
						tabIndex={-1}
						inert
					/>
				</div>
			</div>
		</div>
	)
}

const meta = {
	id: "map-floor-transitions",
	title: "Карта/Переходы этажей",
	component: FloorTransitionPreview,
	args: { slowMotion: false, reducedMotion: false },
} satisfies Meta<typeof FloorTransitionPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { name: "Зум и переход между зданиями" }
export const SlowMotion: Story = {
	name: "Замедленный просмотр",
	args: { slowMotion: true },
}
export const ReducedMotion: Story = {
	name: "Без движения",
	args: { reducedMotion: true },
}
