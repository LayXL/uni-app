import z from "zod"

const processEnv = process.env

const envSchema = z.object({
	botToken: z.string(),
	botEnv: z.enum(["test", "prod"]).default("prod"),
	webAppUrl: z.string().default("http://127.0.0.1:3000/auth"),
	bitrixUrl: z.string().default("https://portal.midis.info/"),
	bitrixLogin: z.string(),
	bitrixPassword: z.string(),
	databaseUrl: z
		.string()
		.default("postgresql://postgres:postgres@localhost:5432/schedule"),
})

export const env = envSchema.parse({
	botToken: processEnv.TELEGRAM_BOT_TOKEN,
	botEnv: processEnv.TELEGRAM_BOT_ENV,
	webAppUrl: processEnv.WEB_APP_URL,
	bitrixUrl: processEnv.BITRIX_URL,
	bitrixLogin: processEnv.BITRIX_LOGIN,
	bitrixPassword: processEnv.BITRIX_PASSWORD,
	databaseUrl: processEnv.DATABASE_URL,
})
