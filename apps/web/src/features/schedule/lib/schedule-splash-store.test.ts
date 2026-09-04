import assert from "node:assert/strict"
import { describe, test } from "node:test"

import {
	createScheduleSplashStore,
	SPLASH_DURATION_MS,
} from "./schedule-splash-store"

describe("schedule splash launch lifecycle", () => {
	test("waits for candidates and expires after five seconds without restarting", () => {
		const expirations: (() => void)[] = []
		const store = createScheduleSplashStore((expire, delay) => {
			assert.equal(delay, 5_000)
			expirations.push(expire)
		})
		assert.equal(SPLASH_DURATION_MS, 5_000)
		assert.equal(store.getSnapshot(), "")
		store.start([])
		assert.equal(expirations.length, 0)
		let notifications = 0
		const unsubscribe = store.subscribe(() => {
			notifications += 1
		})
		store.start(["квест: не проспать"])
		assert.equal(store.getSnapshot(), "квест: не проспать")
		store.start(["Другая группа или повторный эффект"])
		assert.equal(store.getSnapshot(), "квест: не проспать")
		assert.equal(expirations.length, 1)
		expirations[0]()
		assert.equal(store.getSnapshot(), "Расписание")
		store.start(["Повторный вход на вкладку"])
		assert.equal(store.getSnapshot(), "Расписание")
		assert.equal(notifications, 2)
		assert.equal(store.getServerSnapshot(), "")
		unsubscribe()
	})

	test("expires even when the schedule tab is unmounted", () => {
		let expire = () => {}
		const store = createScheduleSplashStore((callback) => {
			expire = callback
		})
		let notifications = 0
		const unsubscribe = store.subscribe(() => {
			notifications += 1
		})
		store.start(["Первая фраза", "Вторая фраза"])
		assert(["Первая фраза", "Вторая фраза"].includes(store.getSnapshot()))
		unsubscribe()
		expire()
		assert.equal(notifications, 1)
		assert.equal(store.getSnapshot(), "Расписание")
	})
})
