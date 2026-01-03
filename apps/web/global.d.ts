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

declare module "react" {
	interface CSSProperties {
		[index: `--${string}`]: string | number | undefined
	}
}

export {}
