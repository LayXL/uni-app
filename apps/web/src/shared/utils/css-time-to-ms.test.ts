import assert from "node:assert/strict"
import { test } from "node:test"

import { cssTimeToMs } from "./css-time-to-ms"

test("preserves CSS duration when production minification converts ms to s", () => {
	assert.equal(cssTimeToMs("150ms"), 150)
	assert.equal(cssTimeToMs(".15s"), 150)
	assert.equal(cssTimeToMs(" 0.15s "), 150)
	assert.equal(cssTimeToMs("1s"), 1_000)
	assert.equal(cssTimeToMs("0s"), 0)
})
