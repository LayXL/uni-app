import { LottiePlayer } from "@/shared/ui/lottie"

export function LegacyDomainPage() {
	return (
		<main className="flex min-h-dvh items-center justify-center px-6 py-10">
			<div className="flex w-full max-w-sm flex-col items-center text-center">
				<LottiePlayer src="duck-shrug" className="h-44 w-44" />

				<div className="mt-2 flex flex-col items-center gap-2">
					<h1 className="text-2xl font-bold">Приложение переехало</h1>
					<p className="text-muted text-balance">
						Эта ссылка больше не работает. Вернитесь в чат с ботом и отправьте
						команду ещё раз.
					</p>
				</div>

				<div className="mt-6 w-full rounded-3xl bg-secondary px-5 py-4">
					<code className="text-xl font-semibold text-foreground">/start</code>
				</div>

				<p className="text-muted mt-3 text-sm text-balance">
					Бот пришлет сообщение с актуальным приложением
				</p>
			</div>
		</main>
	)
}
