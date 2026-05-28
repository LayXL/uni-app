"use client"

import * as Sentry from "@sentry/react"
import { type ReactNode, useState } from "react"

import { Button } from "@/shared/ui/button"
import { LottiePlayer } from "@/shared/ui/lottie"

const GLITCHTIP_DSN =
	"https://df2dbf351aa540a89eb7cbf1821ef945@glitchtip.layxl.dev/1"

if (!Sentry.isInitialized()) {
	Sentry.init({
		dsn: GLITCHTIP_DSN,
		tracesSampleRate: 0.01,
		// autoSessionTracking: false,
	})
}

type FallbackProps = {
	error: unknown
	componentStack: string
	eventId: string
}

function Fallback({ error, componentStack, eventId }: FallbackProps) {
	const [isCopied, setIsCopied] = useState(false)

	const handleCopyLogs = async () => {
		const message = error instanceof Error ? error.message : String(error)
		const stack = error instanceof Error ? (error.stack ?? "") : ""
		const payload = [
			`Event ID: ${eventId}`,
			`Message: ${message}`,
			stack ? `Stack:\n${stack}` : "",
			componentStack ? `Component Stack:\n${componentStack}` : "",
		]
			.filter(Boolean)
			.join("\n\n")

		await navigator.clipboard.writeText(payload)
		setIsCopied(true)
	}

	return (
		<div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
			<Sentry.ErrorBoundary>
				<LottiePlayer src="duck-xray" className="w-40 h-40" />
			</Sentry.ErrorBoundary>
			<div className="flex flex-col items-center justify-center">
				<h2 className="text-2xl font-bold">Что-то пошло не так...</h2>
				<p className="text-muted text-center text-balance">
					Мы&nbsp;уже разбираемся в&nbsp;ситуации и&nbsp;скоро всё исправим
				</p>
			</div>
			<Button
				variant="accent"
				size="md"
				className="w-full"
				label={isCopied ? "Логи скопированы" : "Скопировать логи"}
				onClick={() => void handleCopyLogs()}
			/>
		</div>
	)
}

type SentryProviderProps = {
	children: ReactNode
}

export function SentryProvider({ children }: SentryProviderProps) {
	return (
		<Sentry.ErrorBoundary
			fallback={({ error, componentStack, eventId }) => (
				<Fallback
					error={error}
					componentStack={componentStack}
					eventId={eventId}
				/>
			)}
		>
			{children}
		</Sentry.ErrorBoundary>
	)
}
