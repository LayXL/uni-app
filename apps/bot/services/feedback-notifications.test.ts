import { describe, expect, test } from "bun:test"

import { sendPendingFeedback } from "./feedback-notifications"

type Database = NonNullable<Parameters<typeof sendPendingFeedback>[1]>
type Sender = Parameters<typeof sendPendingFeedback>[0]

const feedback = {
	id: 1,
	userId: 42,
	rating: 2,
	reasons: ["slow_loading"],
	comment: "Дополненный отзыв",
	group: null,
	platform: "vk",
}

// Model the transaction boundary: a failed send must leave the row pending.
const createQueue = () => {
	let pending = true
	let deliveries = 0
	const database = {
		transaction: async (run: (tx: unknown) => Promise<unknown>) => {
			let cleared = false
			const query = {
				from: () => query,
				where: () => query,
				orderBy: () => query,
				limit: () => query,
				for: async (mode: string, options: unknown) => {
					expect(mode).toBe("update")
					expect(options).toEqual({ skipLocked: true })
					return pending ? [feedback] : []
				},
			}
			const result = await run({
				select: () => query,
				update: () => ({
					set: (value: unknown) => {
						expect(value).toEqual({ notificationDueAt: null })
						return {
							where: async () => {
								cleared = true
							},
						}
					},
				}),
			})
			if (cleared) {
				pending = false
				deliveries++
			}
			return result
		},
	} as unknown as Database
	return { database, pending: () => pending, deliveries: () => deliveries }
}

const createSender = (
	send: (chatId: string, text: string) => Promise<unknown>,
) => ({ sendMessage: send }) as Sender

describe("feedback notification queue", () => {
	test("sends the latest content to the forwarding chat and clears it once", async () => {
		const queue = createQueue()
		const messages: string[] = []
		const sender = createSender(async (chatId, text) => {
			expect(chatId).toBe("-100123")
			messages.push(text)
		})
		await sendPendingFeedback(sender, queue.database, "-100123")
		await sendPendingFeedback(sender, queue.database, "-100123")
		expect(messages).toHaveLength(1)
		expect(messages[0]).toContain("Дополненный отзыв")
		expect(messages[0]).toContain("Долго грузит")
		expect(messages[0]).toContain("Оценка: 2/5")
		expect(messages[0]).toContain("Платформа: vk")
		expect(queue.deliveries()).toBe(1)
	})

	test("keeps failed deliveries pending and retries them", async () => {
		const queue = createQueue()
		await expect(
			sendPendingFeedback(
				createSender(async () => {
					throw new Error("Telegram unavailable")
				}),
				queue.database,
				"-100123",
			),
		).rejects.toThrow("Telegram unavailable")
		expect(queue.pending()).toBe(true)
		expect(queue.deliveries()).toBe(0)
		await sendPendingFeedback(
			createSender(async () => {}),
			queue.database,
			"-100123",
		)
		expect(queue.pending()).toBe(false)
	})

	test("keeps feedback pending when the forwarding chat is disabled", async () => {
		const queue = createQueue()
		await sendPendingFeedback(
			createSender(async () => {
				throw new Error("Must not send")
			}),
			queue.database,
			"",
		)
		expect(queue.pending()).toBe(true)
	})
})
