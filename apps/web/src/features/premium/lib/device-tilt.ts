export type DevicePose = { beta: number; gamma: number }

const MAX_TILT = 8
const SENSITIVITY = 0.22
const clamp = (angle: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, angle))
const angleDifference = (angle: number, reference: number) =>
	((angle - reference + 540) % 360) - 180

export function getDeviceTilt(
	pose: DevicePose,
	neutral: DevicePose,
	screenAngle: number,
) {
	const beta = angleDifference(pose.beta, neutral.beta)
	const gamma = angleDifference(pose.gamma, neutral.gamma)
	const radians = (screenAngle * Math.PI) / 180
	const cos = Math.cos(radians)
	const sin = Math.sin(radians)

	return {
		x: clamp(-(beta * cos + gamma * sin) * SENSITIVITY),
		y: clamp((gamma * cos - beta * sin) * SENSITIVITY),
	}
}
