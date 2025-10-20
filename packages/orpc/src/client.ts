import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import bridge from "@vkontakte/vk-bridge"

import type { router } from "./router"

export let token: string | undefined

// Проверяем, что код выполняется в браузере
if (typeof window !== "undefined") {
	if (window.location.search.length > 0) {
		localStorage.setItem("searchParams", window.location.search.slice(1))
		token = window.location.search.slice(1)
	} else {
		const searchParamsFromStorage = localStorage.getItem("searchParams")

		if (searchParamsFromStorage) {
			token = searchParamsFromStorage
		} else {
			token = window.Telegram?.WebApp?.initData
		}
	}
}

bridge.send("VKWebAppGetLaunchParams").then((params) => {
	token = Object.entries(params)
		.map(([key, value]) => `${key}=${value}`)
		.join("&")
})

const link = new RPCLink({
	url: () => {
		// Проверяем, что код выполняется в браузере
		if (typeof window !== "undefined") {
			return process.env.NEXT_PUBLIC_ORPC_URL ?? `${window.location.origin}/rpc`
		}
		// Для сервера используем только переменную окружения
		return process.env.NEXT_PUBLIC_ORPC_URL ?? "/rpc"
	},
	headers: () => ({
		authorization: `Bearer ${token}`,
	}),
})

export const client: RouterClient<typeof router> = createORPCClient(link)
