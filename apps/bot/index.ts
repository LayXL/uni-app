import { env } from "@repo/env"

import { bot } from "./bot"

bot.start({
	onStart: (botInfo) => {
		if (env.botForwardChatId) {
			console.info(
				`@${botInfo.username}: forwarding unhandled private messages to chat ${env.botForwardChatId}`,
			)
		} else {
			console.warn(
				`@${botInfo.username}: message forwarding is disabled. Set the TELEGRAM_FORWARD_CHAT_ID environment variable and restart the bot.`,
			)
		}
	},
})
