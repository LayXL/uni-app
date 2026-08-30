import { LottiePlayer } from "./lottie"

type MaintenancePageProps = {
	title: string
	description: string
}

export function MaintenancePage({ title, description }: MaintenancePageProps) {
	return (
		<main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4">
			<LottiePlayer src="duck-xray" className="h-40 w-40" />
			<div className="flex flex-col items-center justify-center">
				<h1 className="text-center text-2xl font-bold text-balance">{title}</h1>
				<p className="text-muted text-center text-balance">{description}</p>
			</div>
		</main>
	)
}
