import { env } from "@repo/env"

import { Composer } from "../types/composer"

export const forwardComposer = new Composer()

forwardComposer.chatType("private").on("message", async (ctx) => {
	const chatId = env.botForwardChatId
	if (!chatId) {
		return
	}

	try {
		const forwarded = await ctx.forwardMessage(chatId)
		const sender = ctx.from
		if (!sender) {
			return
		}

		const senderDetails = [`ID: ${sender.id}`]
		if (sender.username) {
			senderDetails.push(`Username: @${sender.username}`)
		}

		await ctx.api.sendMessage(chatId, senderDetails.join("\n"), {
			reply_parameters: { message_id: forwarded.message_id },
		})
	} catch (error) {
		console.error(
			"Failed to forward private message with sender details",
			error,
		)
	}
})
