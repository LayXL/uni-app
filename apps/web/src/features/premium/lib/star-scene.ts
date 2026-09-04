import {
	ACESFilmicToneMapping,
	DirectionalLight,
	ExtrudeGeometry,
	Group,
	HemisphereLight,
	MathUtils,
	Mesh,
	MeshPhysicalMaterial,
	PerspectiveCamera,
	PMREMGenerator,
	Scene,
	WebGLRenderer,
} from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { SVGLoader } from "three/addons/loaders/SVGLoader.js"

import { createSpring, stepSpring } from "./star-spring"

export type StarScene = {
	press: (x: number, y: number, spin: boolean) => void
	hover: (point: { x: number; y: number } | null) => void
	hold: (x: number, y: number) => void
	pull: (x: number, y: number) => void
	release: () => void
	dispose: () => void
}

export function createStarScene(
	host: HTMLSpanElement,
	svg: string,
	getDeviceTilt: () => { x: number; y: number },
	onUnavailable: () => void,
): StarScene {
	const accent = getComputedStyle(host).getPropertyValue("--accent").trim()
	const paths = new SVGLoader().parse(svg.replace("currentColor", accent)).paths
	const geometry = new ExtrudeGeometry(
		paths.flatMap((path) => path.toShapes()),
		{
			depth: 1.25,
			bevelEnabled: true,
			bevelThickness: 0.38,
			bevelSize: 0.32,
			bevelSegments: 6,
			curveSegments: 16,
			steps: 1,
		},
	)
	geometry.center()
	geometry.rotateX(Math.PI)
	let renderer: WebGLRenderer
	try {
		renderer = new WebGLRenderer({
			alpha: true,
			antialias: true,
			powerPreference: "low-power",
		})
	} catch (error) {
		geometry.dispose()
		throw error
	}
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	renderer.setClearColor(0x000000, 0)
	renderer.toneMapping = ACESFilmicToneMapping
	renderer.toneMappingExposure = 1.15
	renderer.domElement.setAttribute("aria-hidden", "true")
	host.append(renderer.domElement)

	const scene = new Scene()
	const camera = new PerspectiveCamera(35, 1, 0.1, 100)
	camera.position.z = 38
	const environment = new RoomEnvironment()
	const pmrem = new PMREMGenerator(renderer)
	const environmentMap = pmrem.fromScene(environment, 0.04)
	scene.environment = environmentMap.texture
	environment.dispose()
	pmrem.dispose()
	const material = new MeshPhysicalMaterial({
		color: accent,
		metalness: 0.78,
		roughness: 0.26,
		clearcoat: 0.5,
		clearcoatRoughness: 0.22,
		envMapIntensity: 1.2,
	})
	const star = new Mesh(geometry, material)
	const pose = new Group()
	pose.add(star)
	scene.add(pose, new HemisphereLight(0xffffff, accent, 1.5))
	const keyLight = new DirectionalLight(0xffffff, 3)
	keyLight.position.set(-12, 15, 20)
	const rimLight = new DirectionalLight(0xffffff, 2)
	rimLight.position.set(10, 4, -8)
	scene.add(keyLight, rimLight)

	const tiltX = createSpring()
	const tiltY = createSpring()
	const spin = createSpring()
	const scale = createSpring(1)
	const deviceX = createSpring()
	const deviceY = createSpring()
	const hoverX = createSpring()
	const hoverY = createSpring()
	const pullX = createSpring()
	const pullY = createSpring()
	const springs = [
		tiltX,
		tiltY,
		scale,
		deviceX,
		deviceY,
		hoverX,
		hoverY,
		pullX,
		pullY,
	]
	const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
	let inView = true
	let disposed = false
	let lostContext = false
	let lastTime = 0
	let elapsed = 0
	let releaseAt = 0
	let held = false
	let hovering = false
	let grabPoint = { x: 0, y: 0 }

	function render() {
		const reduced = preference.matches
		pose.rotation.set(
			0.14 +
				(reduced
					? 0
					: deviceX.value +
						tiltX.value +
						hoverX.value +
						Math.sin(elapsed * 0.9) * 0.035),
			-0.24 +
				(reduced
					? 0
					: deviceY.value +
						tiltY.value +
						hoverY.value +
						Math.sin(elapsed * 0.7) * 0.06),
			0.1 + (reduced ? 0 : Math.sin(elapsed * 0.8) * 0.025),
		)
		pose.position.x = reduced ? 0 : pullX.value
		pose.position.y = reduced
			? 0
			: pullY.value + Math.sin(elapsed * 1.05) * 0.32
		star.rotation.y = reduced ? 0 : spin.value
		star.scale.setScalar(reduced ? 1 : scale.value)
		renderer.render(scene, camera)
	}

	function frame(time: number) {
		const delta = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 1 / 60
		lastTime = time
		elapsed += delta
		if (!held && elapsed >= releaseAt) {
			tiltX.target = 0
			tiltY.target = 0
			scale.target = hovering ? 1.025 : 1
		}
		const device = getDeviceTilt()
		deviceX.target = -MathUtils.degToRad(device.x)
		deviceY.target = MathUtils.degToRad(device.y)
		for (const spring of springs) stepSpring(spring, delta)
		stepSpring(spin, delta, 42, 12)
		render()
	}

	function updateActivity() {
		if (disposed || lostContext) return
		lastTime = 0
		renderer.setAnimationLoop(null)
		if (document.hidden || !inView || preference.matches) {
			held = hovering = false
			hoverX.target = hoverY.target = pullX.target = pullY.target = 0
			releaseAt = 0
		}
		if (document.hidden || !inView) return
		if (preference.matches) {
			for (const spring of [...springs, spin]) {
				spring.value = spring.velocity = spring.target = 0
			}
			scale.value = scale.target = 1
			render()
		} else {
			renderer.setAnimationLoop(frame)
		}
	}
	function resize() {
		const { width, height } = host.getBoundingClientRect()
		if (!width || !height || lostContext) return
		renderer.setSize(width, height, false)
		camera.aspect = width / height
		camera.updateProjectionMatrix()
		render()
	}
	const resizeObserver = new ResizeObserver(resize)
	resizeObserver.observe(host)
	const observer = new IntersectionObserver(([entry]) => {
		inView = entry.isIntersecting
		updateActivity()
	})
	observer.observe(host)
	const onContextLost = (event: Event) => {
		event.preventDefault()
		lostContext = true
		renderer.setAnimationLoop(null)
		onUnavailable()
	}
	renderer.domElement.addEventListener("webglcontextlost", onContextLost)
	document.addEventListener("visibilitychange", updateActivity)
	preference.addEventListener("change", updateActivity)
	resize()
	updateActivity()

	return {
		hover(point) {
			if (preference.matches || lostContext) return
			hovering = point !== null
			hoverX.target = (point?.y ?? 0) * 0.12
			hoverY.target = (point?.x ?? 0) * 0.16
		},
		hold(x, y) {
			if (preference.matches || lostContext) return
			held = true
			grabPoint = { x, y }
			tiltX.target = y * 0.3
			tiltY.target = x * 0.36
			scale.target = 0.955
		},
		pull(x, y) {
			if (!held || preference.matches || lostContext) return
			// Elastic resistance bounds the pull even after the pointer leaves the scene.
			const dx = x / (1 + Math.abs(x))
			const dy = y / (1 + Math.abs(y))
			pullX.target = dx * 2.2
			pullY.target = -dy * 1.8
			tiltX.target = grabPoint.y * 0.3 + dy * 0.5
			tiltY.target = grabPoint.x * 0.36 + dx * 0.6
		},
		release() {
			held = false
			releaseAt = 0
			pullX.target = pullY.target = tiltX.target = tiltY.target = 0
			scale.target = hovering ? 1.025 : 1
		},
		press(x, y, double) {
			if (preference.matches || lostContext) return
			// Change only spring targets: ongoing movement and velocity stay continuous.
			tiltX.target = y * 0.38
			tiltY.target = x * 0.45
			scale.target = double ? 0.96 : 0.975
			releaseAt = elapsed + 0.18
			if (double) spin.target += (x < 0 ? -1 : 1) * Math.PI * 2
		},
		dispose() {
			disposed = true
			renderer.setAnimationLoop(null)
			resizeObserver.disconnect()
			observer.disconnect()
			document.removeEventListener("visibilitychange", updateActivity)
			preference.removeEventListener("change", updateActivity)
			renderer.domElement.removeEventListener("webglcontextlost", onContextLost)
			geometry.dispose()
			material.dispose()
			environmentMap.dispose()
			renderer.dispose()
			renderer.forceContextLoss()
			renderer.domElement.remove()
		},
	}
}
