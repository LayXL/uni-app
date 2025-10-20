interface TelegramWebApp {
	initData?: string
}

interface Telegram {
	WebApp?: TelegramWebApp
}

declare global {
	interface Window {
		Telegram?: Telegram
	}
}

export {}
