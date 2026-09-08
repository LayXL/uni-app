import {
	type Group,
	type LightShadow,
	type Material,
	Mesh,
	type Vector3,
} from "three"

import { disposeIndoorGroup } from "./indoor-model"

const fadeGroup = (group: Group) => {
	const materials = new Map<
		Material,
		{ opacity: number; transparent: boolean; depthWrite: boolean }
	>()
	group.traverse((object) => {
		if (!(object instanceof Mesh)) return
		for (const material of Array.isArray(object.material)
			? object.material
			: [object.material]) {
			if (!materials.has(material))
				materials.set(material, {
					opacity: material.opacity,
					transparent: material.transparent,
					depthWrite: material.depthWrite,
				})
		}
	})
	return (opacity: number) => {
		group.visible = opacity > 0
		for (const [material, original] of materials) {
			material.opacity = original.opacity * opacity
			const transparent = opacity < 1 || original.transparent
			if (material.transparent !== transparent) {
				material.transparent = transparent
				material.needsUpdate = true
			}
			material.depthWrite = opacity < 1 ? false : original.depthWrite
		}
	}
}

const scaleAround = (group: Group, pivot: Vector3) => {
	const position = group.position.clone()
	const scale = group.scale.clone()
	return (factor: number) => {
		group.scale.copy(scale).multiplyScalar(factor)
		group.position.copy(position).sub(pivot).multiplyScalar(factor).add(pivot)
	}
}

/** Animate the floor groups around the view center without changing camera zoom. */
export const createIndoorFloorTransition = (
	outgoing: Group,
	incoming: Group,
	started: number,
	options: {
		levelDelta: number
		pivot: Vector3
		shadow: LightShadow
		refresh: () => void
	},
) => {
	const pivot = options.pivot.clone()
	const scaleOut = scaleAround(outgoing, pivot)
	const scaleIn = scaleAround(incoming, pivot)
	const factor = 1.08 ** -Math.sign(options.levelDelta)
	const shadowIntensity = options.shadow.intensity
	const smoothstep = (value: number) => {
		const t = Math.min(Math.max(value, 0), 1)
		return t * t * (3 - 2 * t)
	}
	const fadeOut = fadeGroup(outgoing)
	const fadeIn = fadeGroup(incoming)
	let finished = false
	let revealed = false
	fadeIn(0)
	scaleIn(1 / factor)
	const finish = () => {
		if (finished) return
		finished = true
		fadeIn(1)
		scaleIn(1)
		disposeIndoorGroup(outgoing)
		options.shadow.intensity = shadowIntensity
		options.refresh()
	}
	return {
		get revealed() {
			return revealed
		},
		finish,
		update(now: number) {
			if (finished) return true
			const progress = Math.min(Math.max((now - started) / 300, 0), 1)
			const easedBlend = smoothstep((progress - 0.35) / 0.3)
			fadeOut(1 - easedBlend)
			fadeIn(easedBlend)
			// Shadow depth does not follow material opacity. Hide shadows while
			// both floors overlap, then rebuild before fading the new shadows in.
			options.shadow.intensity =
				shadowIntensity *
				(1 - smoothstep(progress / 0.35) + smoothstep((progress - 0.65) / 0.35))
			const movement = smoothstep(progress)
			scaleOut(factor ** movement)
			scaleIn(factor ** (movement - 1))
			// Incoming geometry is still moving as its shadows reappear.
			if (progress >= 0.65) options.refresh()
			revealed = progress === 1
			if (progress === 1) finish()
			return finished
		},
	}
}
