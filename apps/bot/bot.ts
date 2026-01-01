import { Bot } from "grammy"

import { env } from "@repo/env"

import { setupComposer } from "./composers/setup"
import { startComposer } from "./composers/start"
import { userMiddleware } from "./middlewares/user"
import type { Context } from "./types/context"

export const bot = new Bot<Context>(env.botToken, {
	client: { environment: env.botEnv },
})

// Middlewares
bot.use(userMiddleware)

// Composers
bot.use(startComposer)
bot.use(setupComposer)
