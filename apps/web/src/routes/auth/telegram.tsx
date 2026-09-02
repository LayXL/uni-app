import { createFileRoute } from "@tanstack/react-router"

import TelegramAuthPage from "@/app/auth/telegram/page"

export const Route = createFileRoute("/auth/telegram")({
	component: TelegramAuthPage,
})
