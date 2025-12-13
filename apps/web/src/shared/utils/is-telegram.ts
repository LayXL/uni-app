export const isTelegram =
	typeof window !== "undefined" && "TelegramWebviewProxy" in window
