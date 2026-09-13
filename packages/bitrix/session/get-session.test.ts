import { expect, spyOn, test } from "bun:test"
import { HTTPError, TimeoutError } from "ky"

test("session auth retries transient failures within a bound and respects cancellation", async () => {
	const values = {
		NODE_ENV: "development",
		BITRIX_URL: "https://bitrix.invalid/",
		BITRIX_LOGIN: "test",
		BITRIX_PASSWORD: "test",
		TELEGRAM_BOT_TOKEN: "test",
		VK_CLIENT_SECRET: "test",
	}
	const previous = { ...process.env }
	Object.assign(process.env, values)
	const { bitrix } = await import("../ky")
	const { getSession } = await import("./get-session")
	const originalPost = bitrix.post
	let attempts = 0
	let mode: "recover" | "timeout" | "unauthorized" | "unavailable" = "recover"
	const post = spyOn(bitrix, "post").mockImplementation((path, options) => {
		expect(options?.timeout).toBe(30_000)
		return originalPost(path, {
			...options,
			retry: { ...(options?.retry as object), delay: () => 0 },
			fetch: async (input) => {
				attempts++
				const request = input as Request
				request.signal.throwIfAborted()
				if (mode === "timeout" || (mode === "recover" && attempts === 1)) {
					throw new TimeoutError(request)
				}
				if (mode === "unauthorized") return new Response(null, { status: 401 })
				if (mode === "unavailable") return new Response(null, { status: 503 })
				return new Response(
					`(window.BX||top.BX).message({'bitrix_sessid':'session','USER_ID':'42'})`,
					{ headers: { "set-cookie": "PHPSESSID=test; Path=/" } },
				)
			},
		})
	})
	try {
		const session = await getSession("test", "test")
		expect(session.cookie).toBe("PHPSESSID=test")
		expect(session.user_id).toBe(42)
		expect(attempts).toBe(2)
		mode = "timeout"
		attempts = 0
		await expect(getSession("test", "test")).rejects.toBeInstanceOf(
			TimeoutError,
		)
		expect(attempts).toBe(3)
		mode = "unavailable"
		attempts = 0
		await expect(getSession("test", "test")).rejects.toBeInstanceOf(HTTPError)
		expect(attempts).toBe(3)
		mode = "unauthorized"
		attempts = 0
		await expect(getSession("test", "test")).rejects.toBeInstanceOf(HTTPError)
		expect(attempts).toBe(1)
		const controller = new AbortController()
		controller.abort()
		attempts = 0
		await expect(
			getSession("test", "test", controller.signal),
		).rejects.toMatchObject({ name: "AbortError" })
		expect(attempts).toBeLessThanOrEqual(1)
	} finally {
		post.mockRestore()
		for (const key of Object.keys(values)) {
			if (previous[key] === undefined) delete process.env[key]
			else process.env[key] = previous[key]
		}
	}
})
