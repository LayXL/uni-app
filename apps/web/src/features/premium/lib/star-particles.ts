import {
	boostParticles,
	createParticleBoost,
	getParticleSpeed,
} from "./particle-speed"

export function createStarParticles(canvas: HTMLCanvasElement) {
	const context = canvas.getContext("2d")
	if (!context) return { boost: (_double: boolean) => {}, dispose: () => {} }
	const ctx = context
	const accent = getComputedStyle(canvas).getPropertyValue("--accent").trim()
	const boost = createParticleBoost()
	const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
	const particles = Array.from({ length: 64 }, (_, index) => ({
		angle: Math.random() * Math.PI * 2,
		distance: (index + Math.random()) / 64,
		speed: 0.09 + Math.random() * 0.09,
		size: 0.9 + Math.random() * 1.5,
		sparkle: index % 4 === 0,
		phase: Math.random() * Math.PI * 2,
	}))
	let width = 0
	let height = 0
	let inView = true
	let frameId = 0
	let lastTime = 0
	let disposed = false

	function draw(now: number, delta: number) {
		ctx.clearRect(0, 0, width, height)
		const speed = getParticleSpeed(boost, now)
		ctx.fillStyle = accent
		for (const particle of particles) {
			particle.distance =
				(particle.distance + delta * particle.speed * speed) % 1
			const distance = particle.distance
			const x = width / 2 + Math.cos(particle.angle) * distance * width * 0.58
			const y = height / 2 + Math.sin(particle.angle) * distance * height * 0.58
			const fade =
				Math.min(1, distance / 0.16) * Math.max(0, 1 - distance) ** 0.6
			ctx.globalAlpha =
				fade * (0.55 + Math.sin(now / 900 + particle.phase) * 0.15)
			const size = particle.size
			ctx.beginPath()
			if (particle.sparkle) {
				ctx.moveTo(x, y - size * 2)
				ctx.lineTo(x + size * 0.5, y - size * 0.5)
				ctx.lineTo(x + size * 2, y)
				ctx.lineTo(x + size * 0.5, y + size * 0.5)
				ctx.lineTo(x, y + size * 2)
				ctx.lineTo(x - size * 0.5, y + size * 0.5)
				ctx.lineTo(x - size * 2, y)
				ctx.lineTo(x - size * 0.5, y - size * 0.5)
				ctx.closePath()
			} else {
				ctx.arc(x, y, size, 0, Math.PI * 2)
			}
			ctx.fill()
		}
		ctx.globalAlpha = 1
	}

	function frame(now: number) {
		const delta = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 0
		lastTime = now
		draw(now, delta)
		frameId = requestAnimationFrame(frame)
	}

	function updateActivity() {
		cancelAnimationFrame(frameId)
		frameId = 0
		lastTime = 0
		if (disposed || document.hidden || !inView) return
		if (preference.matches) {
			ctx.clearRect(0, 0, width, height)
		} else {
			frameId = requestAnimationFrame(frame)
		}
	}

	function resize() {
		const rect = canvas.getBoundingClientRect()
		width = rect.width
		height = rect.height
		const pixelRatio = Math.min(window.devicePixelRatio, 2)
		canvas.width = Math.round(width * pixelRatio)
		canvas.height = Math.round(height * pixelRatio)
		ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
		if (!preference.matches) draw(performance.now(), 0)
	}

	const resizeObserver = new ResizeObserver(resize)
	resizeObserver.observe(canvas)
	const observer = new IntersectionObserver(([entry]) => {
		inView = entry.isIntersecting
		updateActivity()
	})
	observer.observe(canvas)
	document.addEventListener("visibilitychange", updateActivity)
	preference.addEventListener("change", updateActivity)
	resize()
	updateActivity()

	return {
		boost(double: boolean) {
			if (!preference.matches) boostParticles(boost, double, performance.now())
		},
		dispose() {
			disposed = true
			cancelAnimationFrame(frameId)
			resizeObserver.disconnect()
			observer.disconnect()
			document.removeEventListener("visibilitychange", updateActivity)
			preference.removeEventListener("change", updateActivity)
			ctx.clearRect(0, 0, width, height)
		},
	}
}
