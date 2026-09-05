import assert from "node:assert/strict"
import { test } from "node:test"

import {
	isPersistedMapView,
	type PersistedMapView,
	persistMapView,
	restoreMapView,
} from "./persisted-map-view"

const savedView: PersistedMapView = {
	version: 1,
	floorId: 0,
	centerX: 420,
	centerY: -150,
	zoom: 0.75,
	rotation: Math.PI / 3,
}

test("preserves the floor, center, zoom and rotation", () => {
	const viewport = restoreMapView(savedView, 390, 844)
	const restored = persistMapView(viewport, savedView.floorId, 390, 844)
	assert.equal(restored.floorId, 0)
	assert.equal(restored.zoom, savedView.zoom)
	assert.equal(restored.rotation, savedView.rotation)
	assert.ok(Math.abs(restored.centerX - savedView.centerX) < 1e-9)
	assert.ok(Math.abs(restored.centerY - savedView.centerY) < 1e-9)
})

test("keeps the same world center when the screen size changes", () => {
	const portrait = restoreMapView(savedView, 390, 844)
	const landscape = restoreMapView(savedView, 844, 390)
	assert.equal(landscape.translateX - portrait.translateX, (844 - 390) / 2)
	assert.equal(landscape.translateY - portrait.translateY, (390 - 844) / 2)
})

test("round-trips a panned viewport at different zooms and rotations", () => {
	for (const zoom of [0.05, 0.5, 1, 8]) {
		for (const rotation of [0, Math.PI / 2, -Math.PI, 2 * Math.PI]) {
			const viewport = { zoom, rotation, translateX: -123, translateY: 456 }
			const persisted = persistMapView(viewport, 2, 1280, 720)
			assert.ok(isPersistedMapView(persisted))
			const restored = restoreMapView(persisted, 1280, 720)
			assert.ok(Math.abs(restored.translateX - viewport.translateX) < 1e-9)
			assert.ok(Math.abs(restored.translateY - viewport.translateY) < 1e-9)
		}
	}
})

test("accepts valid stored views including floor zero", () => {
	assert.ok(isPersistedMapView(savedView))
})

test("rejects missing, outdated and malformed stored views", () => {
	for (const value of [
		null,
		undefined,
		{},
		"invalid",
		{ ...savedView, version: 2 },
		{ ...savedView, floorId: "0" },
		{ ...savedView, floorId: 0.5 },
		{ ...savedView, centerX: Number.NaN },
		{ ...savedView, centerY: Number.POSITIVE_INFINITY },
		{ ...savedView, zoom: 0 },
		{ ...savedView, zoom: 9 },
		{ ...savedView, zoom: "1" },
		{ ...savedView, rotation: Number.NaN },
	]) {
		assert.equal(isPersistedMapView(value), false)
	}
})
