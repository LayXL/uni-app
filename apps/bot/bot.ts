import { Bot, InlineKeyboard } from "grammy"

if (!Bun.env.TELEGRAM_BOT_TOKEN)
  throw new Error("TELEGRAM_BOT_TOKEN is required")

export const bot = new Bot(Bun.env.TELEGRAM_BOT_TOKEN, {
  client: {
    environment: Bun.env.TELEGRAM_BOT_ENV === "test" ? "test" : "prod",
  },
})

bot.command("start", async (ctx) => {
  await ctx.reply("Hello", {
    reply_markup: {
      inline_keyboard: new InlineKeyboard().webApp(
        "Open webapp",
        "http://127.0.0.1:3000/auth"
      ).inline_keyboard,
    },
  })
})
