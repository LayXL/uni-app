import type { Viewport } from "next"
import { type ReactNode, Suspense } from "react"
import "./globals.css"

import { Inter } from "next/font/google"

import { cn } from "@/shared/utils/cn"

import { YandexMetrika } from "./_components/yandex-metrika"
import Providers from "./_providers"

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
}

const inter = Inter({
	subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
	variable: "--font-inter",
})

type LayoutProps = {
	children: ReactNode
}

export default function ({ children }: LayoutProps) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<body
				suppressHydrationWarning
				className={cn(inter.className, "bg-background text-foreground")}
			>
				<Providers>{children}</Providers>
				<Suspense fallback={null}>
					<YandexMetrika />
				</Suspense>
				<noscript>
					<div>
						<img
							src="https://mc.yandex.ru/watch/112037217"
							style={{ position: "absolute", left: "-9999px" }}
							alt=""
						/>
					</div>
				</noscript>
			</body>
		</html>
	)
}
