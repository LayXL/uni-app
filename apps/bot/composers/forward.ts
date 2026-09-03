import { env } from "@repo/env"

import { Composer } from "../types/composer"

export const forwardComposer = new Composer()

forwardComposer.on("message", async (ctx) => {
	const chatId = env.botForwardChatId
	if (!chatId || String(ctx.chat.id) === chatId) {
		return
	}

	try {
		await ctx.forwardMessage(chatId)
	} catch (error) {
		console.error("Failed to forward unhandled message", error)
	}
})
