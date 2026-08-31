"use client"

import { useEffect } from "react"

import { analytics } from "@/shared/lib/analytics"

import { Button } from "./button"
import { LottiePlayer } from "./lottie"

const DEVELOPER_CHANNEL_URL = "https://t.me/secretscode"

type MaintenancePageProps = {
	title: string
	description: string
}

export function MaintenancePage({ title, description }: MaintenancePageProps) {
	useEffect(() => {
		analytics.track("maintenance_channel_button_shown", {
			channel: "secretscode",
		})
	}, [])

	return (
		<main className="grid min-h-[100dvh] grid-rows-[1fr_auto_1fr] px-4">
			<div className="row-start-2 flex flex-col items-center justify-center gap-4">
				<LottiePlayer src="duck-xray" className="h-40 w-40" />
				<div className="flex flex-col items-center justify-center">
					<h1 className="text-center text-2xl font-bold text-balance">
						{title}
					</h1>
					<p className="text-muted text-center text-balance">{description}</p>
				</div>
			</div>

			<div className="row-start-3 flex w-full max-w-sm self-end justify-self-center flex-col items-center gap-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
				<p className="text-muted text-sm text-balance">
					А пока можете подписаться на&nbsp;телеграм-канал разработчика
				</p>
				<Button
					asChild
					className="w-full"
					label="Подписаться"
					onClick={() => {
						analytics.track("maintenance_channel_button_clicked", {
							channel: "secretscode",
						})
					}}
				>
					<a
						href={DEVELOPER_CHANNEL_URL}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Подписаться на телеграм-канал разработчика"
					>
						Подписаться
					</a>
				</Button>
			</div>
		</main>
	)
}
