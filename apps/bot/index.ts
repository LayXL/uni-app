import { env } from "@repo/env"

import { bot } from "./bot"

bot.start({
	onStart: (botInfo) => {
		if (env.botForwardChatId) {
			console.info(
				`@${botInfo.username}: forwarding unhandled messages to chat ${env.botForwardChatId}`,
			)
		} else {
			console.warn(
				`@${botInfo.username}: message forwarding is disabled. Set TELEGRAM_FORWARD_CHAT_ID in .env and restart the bot.`,
			)
		}
	},
})
