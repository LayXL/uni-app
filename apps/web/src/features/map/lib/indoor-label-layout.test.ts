import { expect, test } from "bun:test"

import {
	isLabelInViewport,
	resolveLabelCollisions,
} from "./indoor-label-layout"

const box = (x: number, y: number, wasVisible = false) => ({
	x,
	y,
	w: 100,
	h: 30,
	wasVisible,
})

test("panning across every viewport edge preserves collision winners", () => {
	const labels = [box(50, 80), box(110, 90), box(240, 140)]
	const expected = [true, false, true]
	for (const x of [-1000, -50.5, 0, 0.1, 400, 1000]) {
		for (const y of [-1000, -80.5, 0, 0.1, 800, 1000]) {
			expect(
				resolveLabelCollisions(
					labels.map((label, i) => ({
						...label,
						x: label.x + x,
						y: label.y + y,
						wasVisible: expected[i],
					})),
				),
			).toEqual(expected)
		}
	}
})

test("small scale or rotation changes do not repeatedly toggle a label at the collision threshold", () => {
	expect(resolveLabelCollisions([box(0, 0), box(101, 0, true)])).toEqual([
		true,
		true,
	])
	expect(resolveLabelCollisions([box(0, 0), box(99, 0, true)])).toEqual([
		true,
		false,
	])
	for (const x of [100, 100.1, 101, 103.9]) {
		expect(resolveLabelCollisions([box(0, 0), box(x, 0)])).toEqual([
			true,
			false,
		])
	}
	expect(resolveLabelCollisions([box(0, 0), box(104, 0)])).toEqual([true, true])
})

test("selected labels remain visible and reserve space for lower priority labels", () => {
	expect(
		resolveLabelCollisions([
			{ ...box(0, 0), selected: true },
			box(0, 0),
			box(200, 0),
		]),
	).toEqual([true, false, true])
})

test("labels touching or partially crossing each map edge remain visible", () => {
	for (const [x, y] of [
		[0, 200],
		[-49, 200],
		[400, 200],
		[449, 200],
		[200, 0],
		[200, -14],
		[200, 600],
		[200, 614],
	]) {
		expect(isLabelInViewport(box(x, y), 400, 600)).toBe(true)
	}
	for (const [x, y] of [
		[-51, 200],
		[451, 200],
		[200, -16],
		[200, 616],
	]) {
		expect(isLabelInViewport(box(x, y), 400, 600)).toBe(false)
	}
})
