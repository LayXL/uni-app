import { describe, expect, test } from "bun:test"

import { createProxy, readRateLimit } from "./proxy"

function setup(rateLimit = 2, respond = () => new Response("upstream")) {
	let time = 0
	let calls = 0
	const handler = createProxy({
		target: "https://portal.example",
		rateLimit,
		now: () => time,
		fetchUpstream: async () => {
			calls++
			return respond()
		},
	})
	return {
		request: (path = "/schedule", init?: RequestInit) =>
			handler(new Request(`http://localhost${path}`, init)),
		advance: (ms: number) => {
			time += ms
		},
		calls: () => calls,
	}
}

describe("proxy", () => {
	test("enforces a shared sliding window and Retry-After", async () => {
		const proxy = setup()
		expect((await proxy.request("/a")).status).toBe(200)
		proxy.advance(500)
		expect((await proxy.request("/b")).status).toBe(200)
		proxy.advance(499)
		const limited = await proxy.request("/c")
		expect(limited.status).toBe(429)
		expect(limited.headers.get("retry-after")).toBe("1")
		expect(proxy.calls()).toBe(2)
		proxy.advance(1)
		expect((await proxy.request("/c")).status).toBe(200)
		expect((await proxy.request("/d")).status).toBe(429)
	})

	test("serves reusable cached bodies without spending quota, expires after 10 minutes", async () => {
		const proxy = setup(1)
		expect(await (await proxy.request()).text()).toBe("upstream")
		expect(await (await proxy.request()).text()).toBe("upstream")
		proxy.advance(599_999)
		expect(await (await proxy.request()).text()).toBe("upstream")
		expect(proxy.calls()).toBe(1)
		proxy.advance(1)
		await proxy.request()
		expect(proxy.calls()).toBe(2)
	})

	test("coalesces concurrent identical reads", async () => {
		const proxy = setup(1)
		const responses = await Promise.all([
			proxy.request(),
			proxy.request(),
			proxy.request(),
		])
		expect(
			await Promise.all(responses.map((response) => response.text())),
		).toEqual(["upstream", "upstream", "upstream"])
		expect(proxy.calls()).toBe(1)
	})

	test("separates query, cookies, authorization, and POST bodies", async () => {
		const proxy = setup(20)
		const variants: Record<string, string>[] = [
			{ Cookie: "session=a" },
			{ Cookie: "session=b" },
			{ Authorization: "Bearer a" },
		]
		for (const headers of variants) {
			await proxy.request("/schedule", { headers })
			await proxy.request("/schedule", { headers })
		}
		await proxy.request("/schedule?group=1")
		await proxy.request("/schedule?group=2")
		for (const body of ["gradeLevel=3", "gradeLevel=4"]) {
			const init = { method: "POST", body }
			await proxy.request("/local/handlers/schedule/groups.php", init)
			await proxy.request("/local/handlers/schedule/groups.php", init)
		}
		expect(proxy.calls()).toBe(7)
	})

	test("never caches login or arbitrary writes", async () => {
		const proxy = setup(10)
		for (const path of ["/auth/index.php?login=yes", "/update"]) {
			await proxy.request(path, { method: "POST", body: "same" })
			await proxy.request(path, { method: "POST", body: "same" })
		}
		expect(proxy.calls()).toBe(4)
	})

	test.each([
		{ status: 500 },
		{ headers: { "Set-Cookie": "session=new" } },
		{ headers: { "Cache-Control": "private, no-store" } },
		{ headers: { "Cache-Control": "no-cache" } },
		{ headers: { Vary: "*" } },
	])("does not cache excluded responses: %j", async (init) => {
		const proxy = setup(10, () => new Response("body", init))
		await proxy.request()
		await proxy.request()
		expect(proxy.calls()).toBe(2)
	})

	test("handles HEAD and empty responses", async () => {
		const proxy = setup(10, () => new Response(null, { status: 204 }))
		expect((await proxy.request()).status).toBe(204)
		expect((await proxy.request()).status).toBe(204)
		expect(
			await (await proxy.request("/head", { method: "HEAD" })).text(),
		).toBe("")
	})

	test("validates configured rate limits", () => {
		expect(readRateLimit("5")).toBe(5)
		for (const value of ["", "0", "-1", "1.5", "abc", "Infinity"]) {
			expect(() => readRateLimit(value)).toThrow("positive integer")
		}
	})
})
