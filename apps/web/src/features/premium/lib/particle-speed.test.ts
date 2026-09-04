import assert from "node:assert/strict"
import { test } from "node:test"

import {
	boostParticles,
	createParticleBoost,
	getParticleSpeed,
} from "./particle-speed"

test("a click smoothly boosts speed for two seconds and returns to baseline", () => {
	const boost = createParticleBoost()
	assert.equal(getParticleSpeed(boost, 100), 1)
	boostParticles(boost, false, 100)
	assert.equal(getParticleSpeed(boost, 100), 1)
	assert.ok(getParticleSpeed(boost, 190) > 1)
	assert.equal(getParticleSpeed(boost, 300), 3)
	assert.equal(getParticleSpeed(boost, 1600), 3)
	assert.ok(getParticleSpeed(boost, 1900) < 3)
	assert.equal(getParticleSpeed(boost, 2100), 1)
	assert.equal(getParticleSpeed(boost, 10000), 1)
})

test("a double click boosts further without jumping or slowing down", () => {
	const boost = createParticleBoost()
	boostParticles(boost, false, 100)
	const previous = getParticleSpeed(boost, 220)
	boostParticles(boost, true, 220)
	assert.equal(getParticleSpeed(boost, 220), previous)
	assert.equal(getParticleSpeed(boost, 500), 6)
	assert.equal(getParticleSpeed(boost, 2220), 1)
})

test("repeated clicks extend the effect without unlimited acceleration", () => {
	const boost = createParticleBoost()
	boostParticles(boost, true, 0)
	boostParticles(boost, false, 500)
	assert.equal(getParticleSpeed(boost, 800), 6)
	for (let now = 1000; now < 5000; now += 50) boostParticles(boost, true, now)
	assert.ok(getParticleSpeed(boost, 5100) <= 6)
	assert.equal(getParticleSpeed(boost, 6950), 1)
	boostParticles(boost, false, 7000)
	assert.equal(getParticleSpeed(boost, 7200), 3)
})
