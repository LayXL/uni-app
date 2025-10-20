import { Bot, InlineKeyboard } from "grammy"

import { env } from "@repo/env"

export const bot = new Bot(env.botToken, {
	client: { environment: env.botEnv },
})

const startInlineKeyboard = new InlineKeyboard().webApp(
	"Open webapp",
	env.webAppUrl,
)

bot.command("start", async (ctx) => {
	await ctx.reply("Hello", { reply_markup: startInlineKeyboard })
})
