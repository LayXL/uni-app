import Link from "next/link"

import { Button } from "@/shared/ui/button"
import { LottiePlayer } from "@/shared/ui/lottie"

export function UnauthorizedPage() {
	return (
		<div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
			<LottiePlayer src="duck-shrug" className="w-40 h-40" />
			<div className="flex flex-col items-center justify-center">
				<h2 className="text-2xl font-bold">Не удалось войти</h2>
				<p className="text-muted text-center text-balance">
					Откройте приложение заново через Telegram или VK и попробуйте ещё раз
				</p>
			</div>
			<Button asChild className="w-full" label="Попробовать снова">
				<Link href="/" />
			</Button>
		</div>
	)
}
