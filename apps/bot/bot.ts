import { Bot, InlineKeyboard } from "grammy"
import config from "./config"

export const bot = new Bot(config.botToken, {
  client: {
    environment: config.botEnv,
  },
})

bot.command("start", async (ctx) => {
  await ctx.reply("Hello", {
    reply_markup: {
      inline_keyboard: new InlineKeyboard().webApp(
        "Open webapp",
        config.webAppUrl
      ).inline_keyboard,
    },
  })
})
