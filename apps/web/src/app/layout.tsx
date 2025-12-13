import type { ReactNode } from "react"
import "./globals.css"

import Providers from "./providers"

type LayoutProps = {
	children: ReactNode
}

export default function ({ children }: LayoutProps) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<body suppressHydrationWarning className="bg-background text-foreground">
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
