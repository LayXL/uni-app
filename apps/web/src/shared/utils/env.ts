const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not defined")

export const env = {
  TELEGRAM_BOT_TOKEN,
}
