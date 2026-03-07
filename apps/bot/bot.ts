import { Bot } from "grammy"

import { env } from "@repo/env"

import { notificationsComposer } from "./composers/notifications"
import { setupComposer } from "./composers/setup"
import { startComposer } from "./composers/start"
import { userMiddleware } from "./middlewares/user"
import { startDailyScheduleNotifications } from "./services/daily-schedule-notifications"
import type { Context } from "./types/context"

export const bot = new Bot<Context>(env.botToken, {
	client: { environment: env.botEnv },
})

startDailyScheduleNotifications()

// Middlewares
bot.use(userMiddleware)

// Composers
bot.use(startComposer)
bot.use(notificationsComposer)
bot.use(setupComposer)
