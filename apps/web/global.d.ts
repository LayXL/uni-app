interface TelegramWebApp {
	initData?: string
}

interface Telegram {
	WebApp?: TelegramWebApp
}

declare global {
	interface Window {
		Telegram?: Telegram
		ym?: (counterId: number, method: string, ...args: unknown[]) => void
	}
}

declare module "react" {
	interface CSSProperties {
		[index: `--${string}`]: string | number | undefined
	}
}

export {}
