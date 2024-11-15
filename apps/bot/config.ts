import { z } from "zod"

const schema = z.object({
  botToken: z.string(),
  botEnv: z.enum(["test", "prod"]).default("prod"),
  webAppUrl: z.string().default("http://127.0.0.1:3000/auth"),
})

export default schema.parse({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  botEnv: process.env.TELEGRAM_BOT_ENV,
  webAppUrl: process.env.WEB_APP_URL,
})
