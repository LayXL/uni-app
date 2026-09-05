import assert from "node:assert/strict"
import { test } from "node:test"

import { getDeviceTilt } from "./device-tilt"
import { createSpring, stepSpring } from "./star-spring"

const close = (actual: number, expected: number, tolerance = 1e-6) =>
	assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`)

test("the initial phone pose is neutral, including when held upright", () => {
	const pose = { beta: 75, gamma: -12 }
	const tilt = getDeviceTilt(pose, pose, 0)
	close(tilt.x, 0)
	close(tilt.y, 0)
})

test("phone movement follows the screen axes in both landscape orientations", () => {
	const pose = { beta: 10, gamma: 20 }
	const neutral = { beta: 0, gamma: 0 }
	const portrait = getDeviceTilt(pose, neutral, 0)
	close(portrait.x, -2.2)
	close(portrait.y, 4.4)
	const landscape = getDeviceTilt(pose, neutral, 90)
	close(landscape.x, -4.4)
	close(landscape.y, -2.2)
	const reverse = getDeviceTilt(pose, neutral, -90)
	close(reverse.x, 4.4)
	close(reverse.y, 2.2)
})

test("large phone movements stay subtle and crossing ±180° does not jump", () => {
	assert.deepEqual(
		getDeviceTilt({ beta: 100, gamma: -80 }, { beta: 0, gamma: 0 }, 0),
		{ x: -8, y: -8 },
	)
	close(
		getDeviceTilt({ beta: -179, gamma: 0 }, { beta: 179, gamma: 0 }, 0).x,
		-0.44,
	)
})

test("spin springs complete a turn in either direction at different refresh rates", () => {
	for (const fps of [30, 60, 120]) {
		for (const direction of [-1, 1]) {
			const spring = createSpring()
			spring.target = direction * Math.PI * 2
			stepSpring(spring, 1 / fps, 42, 12)
			assert.equal(Math.sign(spring.value), direction)
			assert.ok(Math.abs(spring.value) < 0.25)
			for (let index = 0; index < fps * 3; index++)
				stepSpring(spring, 1 / fps, 42, 12)
			close(spring.value, spring.target, 0.001)
		}
	}
})

test("retargeting an ongoing click keeps position and velocity continuous", () => {
	const spring = createSpring()
	spring.target = 0.4
	for (let index = 0; index < 8; index++) stepSpring(spring, 1 / 60)
	const { value, velocity } = spring
	spring.target = -0.4
	assert.equal(spring.value, value)
	assert.equal(spring.velocity, velocity)
	stepSpring(spring, 1 / 120)
	assert.ok(Math.abs(spring.value - value) < 0.03)
	for (let index = 0; index < 180; index++) stepSpring(spring, 1 / 60)
	close(spring.value, -0.4, 0.001)
})
