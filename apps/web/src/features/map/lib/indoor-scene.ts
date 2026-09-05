import {
	Box3,
	DirectionalLight,
	HemisphereLight,
	MathUtils,
	OrthographicCamera,
	PCFShadowMap,
	Raycaster,
	Scene,
	TOUCH,
	Vector2,
	Vector3,
	WebGLRenderer,
} from "three"
import { MapControls } from "three/addons/controls/MapControls.js"

import type {
	BuildingScheme,
	Coordinate,
	Floor,
} from "@repo/shared/building-scheme"

import { getMapIconColor } from "./icon-style"
import {
	indoorFocusTarget,
	stopIndoorInertia,
	withIndoorViewTilt,
} from "./indoor-controls"
import { entityCenter, type IndoorRoutePoint } from "./indoor-geometry"
import {
	createIndoorFloor,
	createIndoorRoute,
	disposeIndoorGroup,
	highlightIndoorRoom,
	type IndoorLabel,
	WALL_HEIGHT,
} from "./indoor-model"
import { createIndoorTouchRotation } from "./indoor-touch-rotation"

export type IndoorView = "3d" | "top"
export type IndoorCameraView = {
	target: [number, number, number]
	offset: [number, number, number]
	zoom: number
	view: IndoorView
}

export function createIndoorScene(
	host: HTMLDivElement,
	callbacks: {
		onSelect: (id: number) => void
		onFloor: (id: number) => void
		onError: () => void
		onCamera?: (camera: IndoorCameraView) => void
	},
) {
	const renderer = new WebGLRenderer({
		antialias: true,
		alpha: true,
		powerPreference: "low-power",
	})
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = PCFShadowMap
	renderer.shadowMap.autoUpdate = false
	const canvas = renderer.domElement
	canvas.className = "indoor-canvas"
	canvas.setAttribute("role", "img")
	canvas.setAttribute("aria-label", "Карта этажа")
	host.append(canvas)
	const labelLayer = document.createElement("div")
	labelLayer.className = "indoor-labels"
	host.append(labelLayer)
	const scene = new Scene()
	scene.add(new HemisphereLight(0xffffff, 0x64748b, 1.2))
	const light = new DirectionalLight(0xffffff, 1.8)
	light.castShadow = true
	light.shadow.mapSize.set(2048, 2048)
	light.shadow.normalBias = 2
	light.shadow.bias = -0.0001
	light.position.set(-1000, 2400, -1600)
	scene.add(light, light.target)
	const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 100000)
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
	const controls = new MapControls(camera, host)
	controls.screenSpacePanning = false
	controls.enableDamping = !reducedMotion.matches
	controls.dampingFactor = 0.12
	controls.minPolarAngle = 0
	controls.maxPolarAngle = Math.PI / 3
	controls.minZoom = 0.35
	controls.maxZoom = 12
	controls.zoomToCursor = true
	controls.touches.TWO = TOUCH.DOLLY_PAN
	let width = 1
	let height = 1
	let span = 2000
	let fitZoom = 1
	let view: IndoorView = "3d"
	let floor: Floor | undefined
	let data: BuildingScheme | undefined
	let model: ReturnType<typeof createIndoorFloor> | undefined
	let routeModel: ReturnType<typeof createIndoorRoute> | undefined
	let shineFrame = 0
	let shineTimer: ReturnType<typeof setTimeout> | undefined
	let shineStarted = 0
	const stopRouteShine = () => {
		cancelAnimationFrame(shineFrame)
		clearTimeout(shineTimer)
		shineFrame = 0
	}
	const animateRouteShine = () => {
		stopRouteShine()
		if (disposed || !active || !routeModel?.hasRoute) return
		const delay = routeModel.updateShine(
			performance.now() - shineStarted,
			!reducedMotion.matches,
		)
		renderer.render(scene, camera)
		if (reducedMotion.matches) return
		if (delay > 0) shineTimer = setTimeout(animateRouteShine, delay)
		else shineFrame = requestAnimationFrame(animateRouteShine)
	}
	let selectedId: number | null = null
	let frame = 0
	let disposed = false
	let active = true
	let tween:
		| {
				start: number
				fromTarget: Vector3
				toTarget: Vector3
				fromOffset: Vector3
				toOffset: Vector3
				fromZoom: number
				toZoom: number
		  }
		| undefined
	type LabelNode = {
		data: IndoorLabel
		element: HTMLElement
		anchor: HTMLDivElement
		width: number
		height: number
		visible: boolean
		removalTimer?: ReturnType<typeof setTimeout>
	}
	let labels: LabelNode[] = []
	const labelNodes = new Map<string, LabelNode>()
	const labelExitDuration =
		Number.parseFloat(
			getComputedStyle(host).getPropertyValue("--tt-out-dur"),
		) || 150
	const setLabelVisible = (label: LabelNode, visible: boolean) => {
		if (label.visible === visible) return
		label.visible = visible
		label.element.dataset.visible = String(visible)
		label.element.inert = !visible
		label.element.setAttribute("aria-hidden", String(!visible))
	}
	const raycaster = new Raycaster()
	const projection = new Vector3()
	const bounds = new Box3()
	const cameraView = (): IndoorCameraView => ({
		target: controls.target.toArray(),
		offset: camera.position.clone().sub(controls.target).toArray(),
		zoom: camera.zoom,
		view,
	})
	const requestRender = () => {
		if (!frame && !disposed && active) frame = requestAnimationFrame(render)
	}
	const touchRotation = createIndoorTouchRotation(
		host,
		camera,
		controls,
		reducedMotion,
		requestRender,
	)
	const updateRotationLimits = (transitioning = false) => {
		// Keep azimuth rotation in 2D; only lock the camera's tilt.
		controls.maxPolarAngle = view === "top" && !transitioning ? 0 : Math.PI / 3
	}
	const layoutLabels = () => {
		const occupied: { x: number; y: number; w: number; h: number }[] = []
		for (const label of labels) {
			projection
				.set(label.data.position.x, WALL_HEIGHT + 12, label.data.position.y)
				.project(camera)
			const x = ((projection.x + 1) * width) / 2
			const y = ((1 - projection.y) * height) / 2
			const w = label.width + 8
			const h = label.height + 6
			const outside =
				projection.z < -1 ||
				projection.z > 1 ||
				x < w / 2 + 8 ||
				x > width - w / 2 - 8 ||
				y < 60 ||
				y > height - 155
			const collides = occupied.some(
				(other) =>
					Math.abs(x - other.x) < (w + other.w) / 2 &&
					Math.abs(y - other.y) < (h + other.h) / 2,
			)
			const visible = !outside && (!collides || label.data.selected)
			setLabelVisible(label, Boolean(visible))
			label.anchor.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%)`
			if (visible) {
				occupied.push({ x, y, w, h })
			}
		}
	}
	function render(now: number) {
		frame = 0
		if (disposed) return
		if (tween) {
			const progress = Math.min((now - tween.start) / 360, 1)
			const t = 1 - (1 - progress) ** 3
			controls.target.lerpVectors(tween.fromTarget, tween.toTarget, t)
			camera.position
				.lerpVectors(tween.fromOffset, tween.toOffset, t)
				.add(controls.target)
			camera.zoom = MathUtils.lerp(tween.fromZoom, tween.toZoom, t)
			camera.updateProjectionMatrix()
			updateRotationLimits(progress < 1)
			controls.update()
			if (progress === 1) tween = undefined
			else requestRender()
		} else {
			// A change schedules the next frame until gesture inertia settles.
			controls.update()
		}
		if (touchRotation.update(now)) requestRender()
		renderer.render(scene, camera)
		layoutLabels()
		if (!tween && !frame) callbacks.onCamera?.(cameraView())
	}
	const activateLabel = (label: IndoorLabel) => {
		if (label.floorId != null) callbacks.onFloor(label.floorId)
		else if (label.entityId != null) callbacks.onSelect(label.entityId)
	}
	const rebuildLabels = () => {
		const activeKeys = new Set<string>()
		labels = [...(routeModel?.labels ?? []), ...(model?.labels ?? [])]
			.map((label) => ({ ...label, selected: label.entityId === selectedId }))
			.sort(
				(a, b) =>
					Number(b.selected) - Number(a.selected) || b.priority - a.priority,
			)
			.map((label) => {
				const key = JSON.stringify([
					floor?.id,
					label.entityId,
					label.floorId,
					label.position,
					label.text,
					label.icon,
					label.iconOnly,
				])
				activeKeys.add(key)
				let node = labelNodes.get(key)
				if (!node) {
					const interactive = label.entityId != null || label.floorId != null
					const element = document.createElement(
						interactive ? "button" : "span",
					)
					element.className = "indoor-label"
					element.dataset.visible = "false"
					element.inert = true
					element.setAttribute("aria-hidden", "true")
					if (label.iconOnly && !interactive) {
						element.setAttribute("role", "img")
						element.setAttribute("aria-label", label.text)
					}
					if (interactive) {
						element.setAttribute("type", "button")
						element.setAttribute("aria-label", label.text)
						// Pointer activation is handled after gesture/slop detection on the host.
						// Keep semantic button activation for assistive technology.
						element.onclick = (event) => {
							if (event.detail === 0) activateLabel(label)
						}
					}
					if (label.icon && /^[\w-]+$/.test(label.icon)) {
						const icon = document.createElement("img")
						icon.src = `/icons/${label.icon}.svg`
						icon.alt = ""
						icon.draggable = false
						icon.width = 18
						icon.height = 18
						icon.onerror = () => {
							icon.remove()
							requestRender()
						}
						element.append(icon)
					}
					if (!label.iconOnly) {
						const text = document.createElement("span")
						text.textContent = label.text
						element.append(text)
					}
					const anchor = document.createElement("div")
					anchor.className = "indoor-label-anchor"
					anchor.append(element)
					labelLayer.append(anchor)
					node = {
						data: label,
						element,
						anchor,
						width: element.offsetWidth,
						height: element.offsetHeight,
						visible: false,
					}
					labelNodes.set(key, node)
				}
				clearTimeout(node.removalTimer)
				node.removalTimer = undefined
				node.data = label
				node.element.dataset.selected = String(label.selected)
				node.element.dataset.kind =
					label.priority >= 1000 ? "route" : label.icon ? "place" : "room"
				if (label.icon)
					node.element.style.setProperty(
						"--indoor-place-color",
						getMapIconColor(label.icon),
					)
				return node
			})
		for (const [key, node] of labelNodes) {
			if (activeKeys.has(key) || node.removalTimer != null) continue
			setLabelVisible(node, false)
			node.removalTimer = setTimeout(
				() => {
					node.anchor.remove()
					labelNodes.delete(key)
				},
				reducedMotion.matches ? 0 : labelExitDuration,
			)
		}
		requestRender()
	}
	const moveCamera = (
		target: Vector3,
		offset: Vector3,
		zoom: number,
		animate = true,
	) => {
		touchRotation.stop()
		stopIndoorInertia(controls, camera)
		updateRotationLimits(animate && !reducedMotion.matches)
		if (animate && !reducedMotion.matches) {
			tween = {
				start: performance.now(),
				fromTarget: controls.target.clone(),
				toTarget: target,
				fromOffset: camera.position.clone().sub(controls.target),
				toOffset: offset,
				fromZoom: camera.zoom,
				toZoom: zoom,
			}
		} else {
			tween = undefined
			controls.target.copy(target)
			camera.position.copy(target).add(offset)
			camera.zoom = zoom
			camera.updateProjectionMatrix()
			controls.update()
		}
		requestRender()
	}
	const defaultOffset = () =>
		view === "top"
			? new Vector3(0, span * 2, 0.001)
			: new Vector3(span * 0.85, span * 2, span * 1.65)
	const resize = () => {
		width = Math.max(host.clientWidth, 1)
		height = Math.max(host.clientHeight, 1)
		const aspect = width / height
		camera.left = (-span * aspect) / 2
		camera.right = (span * aspect) / 2
		camera.top = span / 2
		camera.bottom = -span / 2
		camera.updateProjectionMatrix()
		renderer.setSize(width, height)
		requestRender()
	}
	const fit = (animate = true) => {
		if (!model) return
		bounds.setFromObject(model.group)
		const size = bounds.getSize(new Vector3())
		const center = bounds.getCenter(new Vector3())
		center.y = 0
		span = Math.max(size.z + 160, (size.x + 180) / (width / height))
		resize()
		fitZoom = Math.max(0.35, Math.min(0.84, (height - 250) / height))
		// Reserve the bottom search/navigation area, moving the building slightly upward.
		center.z += span * 0.08
		moveCamera(center, defaultOffset(), fitZoom, animate)
	}
	const focus = (point: Coordinate) => {
		const offset = camera.position.clone().sub(controls.target)
		const zoom = Math.max(fitZoom * 1.8, camera.zoom)
		moveCamera(
			indoorFocusTarget(
				new Vector3(point.x, 0, point.y),
				offset,
				(span * 0.1) / zoom,
			),
			offset,
			zoom,
		)
	}
	const zoom = (factor: number) => {
		moveCamera(
			controls.target.clone(),
			camera.position.clone().sub(controls.target),
			MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom),
			false,
		)
	}
	const setView = (next: IndoorView) => {
		if (next === view) return
		const offset = withIndoorViewTilt(
			camera.position.clone().sub(controls.target),
			next,
		)
		view = next
		moveCamera(controls.target.clone(), offset, camera.zoom)
	}
	controls.addEventListener("change", requestRender)
	const interrupt = () => {
		tween = undefined
		stopIndoorInertia(controls, camera)
		updateRotationLimits()
		controls.update()
	}
	controls.addEventListener("start", interrupt)
	const motionPreferenceChanged = () => {
		touchRotation.stop()
		interrupt()
		controls.enableDamping = !reducedMotion.matches
		animateRouteShine()
	}
	reducedMotion.addEventListener("change", motionPreferenceChanged)
	const pointers = new Set<number>()
	let down: { x: number; y: number; id: number } | undefined
	const pointerDown = (event: PointerEvent) => {
		if (!active) return
		touchRotation.down(event)
		pointers.add(event.pointerId)
		down =
			pointers.size === 1 && event.button === 0
				? { x: event.clientX, y: event.clientY, id: event.pointerId }
				: undefined
	}
	const pointerMove = (event: PointerEvent) => {
		if (!active) return
		touchRotation.move(event)
		if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6)
			down = undefined
	}
	const pointerUp = (event: PointerEvent) => {
		if (!active) return
		touchRotation.up(event)
		pointers.delete(event.pointerId)
		if (!down || down.id !== event.pointerId || !model) return
		down = undefined
		const label = labels.find((node) => {
			if (
				!node.visible ||
				(node.data.entityId == null && node.data.floorId == null)
			)
				return false
			const rect = node.element.getBoundingClientRect()
			return (
				event.clientX >= rect.left &&
				event.clientX <= rect.right &&
				event.clientY >= rect.top &&
				event.clientY <= rect.bottom
			)
		})
		if (label) {
			activateLabel(label.data)
			return
		}
		const rect = canvas.getBoundingClientRect()
		raycaster.setFromCamera(
			new Vector2(
				((event.clientX - rect.left) / width) * 2 - 1,
				(-(event.clientY - rect.top) / height) * 2 + 1,
			),
			camera,
		)
		const hit = raycaster.intersectObjects([...model.rooms.values()], false)[0]
		if (hit) callbacks.onSelect(hit.object.userData.entityId)
	}
	const pointerCancel = (event: PointerEvent) => {
		touchRotation.up(event, true)
		pointers.delete(event.pointerId)
		down = undefined
	}
	const contextLost = (event: Event) => {
		event.preventDefault()
		callbacks.onError()
	}
	host.addEventListener("pointerdown", pointerDown)
	// MapControls captures only the first pointer; also track the second finger
	// when it leaves the map so a release cannot leave a stale twist in progress.
	host.ownerDocument.addEventListener("pointermove", pointerMove)
	host.ownerDocument.addEventListener("pointerup", pointerUp)
	host.ownerDocument.addEventListener("pointercancel", pointerCancel)
	host.addEventListener("wheel", touchRotation.stop, { passive: true })
	canvas.addEventListener("webglcontextlost", contextLost)
	const observer = new ResizeObserver(resize)
	observer.observe(host)
	resize()

	return {
		setActive: (next: boolean) => {
			if (active === next) return
			stopRouteShine()
			active = next
			controls.enabled = next
			if (next) {
				resize()
				animateRouteShine()
				return
			}
			touchRotation.stop()
			pointers.clear()
			down = undefined
			if (tween) moveCamera(tween.toTarget, tween.toOffset, tween.toZoom, false)
			stopIndoorInertia(controls, camera)
			cancelAnimationFrame(frame)
			frame = 0
			callbacks.onCamera?.(cameraView())
		},
		fit,
		focus,
		zoom,
		setView,
		getView: cameraView,
		restore: (saved: IndoorCameraView) => {
			view = saved.view
			moveCamera(
				new Vector3(...saved.target),
				new Vector3(...saved.offset),
				saved.zoom,
				false,
			)
		},
		setFloor: (
			nextData: BuildingScheme,
			floorId: number,
			theme: "light" | "dark",
		) => {
			const nextFloor = nextData.floors.find((f) => f.id === floorId)
			if (!nextFloor) return
			const changed = floor?.id !== nextFloor.id
			data = nextData
			floor = nextFloor
			if (model) disposeIndoorGroup(model.group)
			if (routeModel) disposeIndoorGroup(routeModel.group)
			stopRouteShine()
			routeModel = undefined
			model = createIndoorFloor(data, floor, theme)
			scene.add(model.group)
			bounds.setFromObject(model.group)
			const center = bounds.getCenter(new Vector3())
			const size = bounds.getSize(new Vector3()).length()
			light.target.position.copy(center)
			light.position
				.copy(center)
				.add(new Vector3(-size * 0.4, size, -size * 0.6))
			light.shadow.camera.left = -size / 2
			light.shadow.camera.right = size / 2
			light.shadow.camera.top = size / 2
			light.shadow.camera.bottom = -size / 2
			light.shadow.camera.far = size * 3
			light.shadow.camera.updateProjectionMatrix()
			renderer.shadowMap.needsUpdate = true
			highlightIndoorRoom(model, selectedId)
			rebuildLabels()
			if (changed) fit(false)
		},
		select: (id: number | null, center = true) => {
			selectedId = id
			if (model) highlightIndoorRoom(model, id)
			rebuildLabels()
			const entity = data?.entities.find(
				(e) => e.id === id && e.floorId === floor?.id,
			)
			if (entity && floor && center) focus(entityCenter(entity, floor))
		},
		setRoute: (route: IndoorRoutePoint[] = []) => {
			stopRouteShine()
			if (routeModel) disposeIndoorGroup(routeModel.group)
			routeModel =
				floor && data ? createIndoorRoute(route, floor, data) : undefined
			if (routeModel) scene.add(routeModel.group)
			shineStarted = performance.now()
			animateRouteShine()
			rebuildLabels()
		},
		dispose: () => {
			disposed = true
			stopRouteShine()
			cancelAnimationFrame(frame)
			observer.disconnect()
			controls.removeEventListener("change", requestRender)
			controls.removeEventListener("start", interrupt)
			reducedMotion.removeEventListener("change", motionPreferenceChanged)
			controls.dispose()
			host.removeEventListener("pointerdown", pointerDown)
			host.ownerDocument.removeEventListener("pointermove", pointerMove)
			host.ownerDocument.removeEventListener("pointerup", pointerUp)
			host.ownerDocument.removeEventListener("pointercancel", pointerCancel)
			host.removeEventListener("wheel", touchRotation.stop)
			canvas.removeEventListener("webglcontextlost", contextLost)
			if (model) disposeIndoorGroup(model.group)
			if (routeModel) disposeIndoorGroup(routeModel.group)
			renderer.dispose()
			light.shadow.dispose()
			canvas.remove()
			for (const node of labelNodes.values()) clearTimeout(node.removalTimer)
			labelNodes.clear()
			labelLayer.remove()
		},
	}
}

export type IndoorScene = ReturnType<typeof createIndoorScene>
