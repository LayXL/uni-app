import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8")

for (const storageFails of [false, true]) {
	test(`retires legacy worker and reloads clients when storage ${storageFails ? "fails" : "works"}`, async () => {
		const scope = "https://mapp.layxl.dev/"
		const oldCache = `workbox-precache-v2-${scope}`
		const cacheNames = new Set([oldCache, "unrelated-cache"])
		const events = new Map<
			string,
			(event: { waitUntil: (work: Promise<unknown>) => void }) => void
		>()
		const navigated: string[] = []
		let unregistered = false
		let skippedWaiting = false
		const urls = [`${scope}?x=-1140&floor=0#map`, `${scope}schedule`]

		runInNewContext(source, {
			self: {
				addEventListener: (
					name: string,
					callback: typeof events extends Map<string, infer V> ? V : never,
				) => events.set(name, callback),
				skipWaiting: async () => {
					skippedWaiting = true
				},
				registration: {
					scope,
					unregister: async () => {
						unregistered = true
					},
				},
				clients: {
					matchAll: async (options: unknown) => {
						expect(options).toEqual({ type: "window" })
						return urls.map((url, index) => ({
							url,
							navigate: async (target: string) => {
								expect(unregistered).toBe(true)
								navigated.push(target)
								if (index === 0) throw new Error("Tab closed during migration")
							},
						}))
					},
				},
			},
			caches: {
				delete: async (name: string) => {
					if (storageFails) throw new Error("Storage unavailable")
					return cacheNames.delete(name)
				},
			},
		})

		for (const name of ["install", "activate"]) {
			let work: Promise<unknown> | undefined
			events.get(name)?.({
				waitUntil: (promise) => {
					work = promise
				},
			})
			expect(work).toBeDefined()
			await work
		}
		expect(skippedWaiting).toBe(true)
		expect(unregistered).toBe(true)
		expect(navigated).toEqual(urls)
		expect(cacheNames.has("unrelated-cache")).toBe(true)
		expect(cacheNames.has(oldCache)).toBe(storageFails)
		expect(events.has("fetch")).toBe(false)
	})
}
