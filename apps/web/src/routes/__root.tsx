import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router"
import { lazy, Suspense, useEffect, useState } from "react"

import { YandexMetrika } from "@/app/_components/yandex-metrika"
import Providers from "@/app/_providers"

import styles from "../app/globals.css?url"

const LegacyDomainPage = lazy(() =>
	import("@/shared/ui/legacy-domain-page").then((module) => ({
		default: module.LegacyDomainPage,
	})),
)

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content:
					"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
			},
		],
		links: [
			{ rel: "stylesheet", href: styles },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
			},
		],
	}),
	component: RootDocument,
})

function RootDocument() {
	return (
		<html lang="ru" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body suppressHydrationWarning className="bg-background text-foreground">
				<Providers>
					<RootContent />
				</Providers>
				<YandexMetrika />
				<noscript>
					<div>
						<img
							src="https://mc.yandex.ru/watch/112037217"
							style={{ position: "absolute", left: "-9999px" }}
							alt=""
						/>
					</div>
				</noscript>
				<Scripts />
			</body>
		</html>
	)
}

function RootContent() {
	const [isLegacyDomain, setIsLegacyDomain] = useState(false)

	useEffect(() => {
		setIsLegacyDomain(window.location.hostname === "midis.layxl.dev")
	}, [])

	return isLegacyDomain ? (
		<Suspense fallback={null}>
			<LegacyDomainPage />
		</Suspense>
	) : (
		<Outlet />
	)
}
