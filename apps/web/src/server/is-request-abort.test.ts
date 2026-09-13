import { expect, test } from "bun:test"

import { isRequestAbort } from "./is-request-abort"

test("only suppresses errors associated with a cancelled request", () => {
	const controller = new AbortController()
	const abort = new DOMException("The connection was closed.", "AbortError")
	expect(isRequestAbort(abort, controller.signal)).toBe(false)
	controller.abort()
	expect(isRequestAbort(abort, controller.signal)).toBe(true)
	expect(isRequestAbort(controller.signal.reason, controller.signal)).toBe(true)
	expect(isRequestAbort(new Error("Database failure"), controller.signal)).toBe(
		false,
	)
	expect(
		isRequestAbort(
			new DOMException("Timeout", "TimeoutError"),
			controller.signal,
		),
	).toBe(false)
})
