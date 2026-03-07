import z from "zod"

const processEnv = process.env

const envSchema = z.object({
	nodeEnv: z.enum(["development", "production"]).default("production"),
	botToken: z.string(),
	botEnv: z.enum(["test", "prod"]).default("prod"),
	webAppUrl: z.string().default("http://127.0.0.1:3000/auth"),
	bitrixUrl: z.string().default("https://portal.midis.info/"),
	bitrixLogin: z.string(),
	bitrixPassword: z.string(),
	databaseUrl: z
		.string()
		.default("postgresql://postgres:postgres@localhost:5432/schedule"),
	vkClientSecret: z.string(),
	s3Bucket: z.string().optional(),
	s3Endpoint: z.string().optional(),
	s3AccessKeyId: z.string().optional(),
	s3SecretAccessKey: z.string().optional(),
	proxyTarget: z.string().default("https://portal.midis.info"),
})

export const env = envSchema.parse({
	nodeEnv: processEnv.NODE_ENV,
	botToken: processEnv.TELEGRAM_BOT_TOKEN,
	botEnv: processEnv.TELEGRAM_BOT_ENV,
	webAppUrl: processEnv.WEB_APP_URL,
	bitrixUrl: processEnv.BITRIX_URL,
	bitrixLogin: processEnv.BITRIX_LOGIN,
	bitrixPassword: processEnv.BITRIX_PASSWORD,
	databaseUrl: processEnv.DATABASE_URL,
	vkClientSecret: processEnv.VK_CLIENT_SECRET,
	s3Bucket: processEnv.S3_BUCKET,
	s3Endpoint: processEnv.S3_ENDPOINT,
	s3AccessKeyId: processEnv.S3_ACCESS_KEY_ID,
	s3SecretAccessKey: processEnv.S3_SECRET_ACCESS_KEY,
	proxyTarget: processEnv.PROXY_TARGET,
})
