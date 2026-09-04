export type StarSpring = { value: number; velocity: number; target: number }

export function stepSpring(
	spring: StarSpring,
	delta: number,
	stiffness = 100,
	damping = 18,
) {
	// Small integration steps keep the same soft response at 30, 60 and 120 Hz.
	const steps = Math.max(1, Math.ceil(delta / (1 / 120)))
	const dt = delta / steps
	for (let index = 0; index < steps; index++) {
		const acceleration =
			(spring.target - spring.value) * stiffness - spring.velocity * damping
		spring.velocity += acceleration * dt
		spring.value += spring.velocity * dt
	}
}

export const createSpring = (value = 0): StarSpring => ({
	value,
	velocity: 0,
	target: value,
})
