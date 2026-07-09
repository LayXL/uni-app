import { InlineKeyboard } from "grammy"

import { env } from "@repo/env"

import { Composer } from "../types/composer"

export const startComposer = new Composer()

startComposer.command("start", async (ctx) => {
	await ctx.api.setChatMenuButton({
		chat_id: ctx.chat.id,
		menu_button: {
			type: "web_app",
			text: "Открыть",
			web_app: { url: env.webAppUrl },
		},
	})

	const message =
		"👋 Привет! Я экономлю твое время с расписанием и картой МИДИС\n\n" +
		"Сразу показываю твои пары и кидаю расписание на завтра, чтобы не ловить сюрпризы. Помогаю найти аудиторию или расписание препода. Карта под рукой: крути, зумь, переключай этажи и строй маршрут, чтобы не опоздать\n\n"

	await ctx.reply(message, { reply_markup: startInlineKeyboard })
})

const startInlineKeyboard = new InlineKeyboard().webApp(
	"🚀 Открыть мини-приложение",
	env.webAppUrl,
)
