import { env } from "@repo/env"

import { Composer } from "../types/composer"

export const forwardComposer = new Composer()

forwardComposer.chatType("private").on("message", async (ctx) => {
	const chatId = env.botForwardChatId
	if (!chatId) {
		return
	}

	try {
		await ctx.forwardMessage(chatId)
	} catch (error) {
		console.error("Failed to forward unhandled private message", error)
	}
})
