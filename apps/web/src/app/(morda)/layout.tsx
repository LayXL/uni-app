import { HydrationBoundary } from "@tanstack/react-query"
import { type ReactNode, Suspense } from "react"

import { orpc } from "@repo/orpc/react"

import { UnauthorizedPage } from "@/shared/ui/unauthorized-page"
import { Fetcher } from "@/shared/utils/fetcher"
import { isUnauthorizedError } from "@/shared/utils/is-unauthorized-error"

import { MainTabBar } from "./_ui/main-tab-bar"
import { MaintenanceGate } from "./_ui/maintenance-gate"
import { YandexMetrikaUser } from "./_ui/yandex-metrika-user"

const MordaLoadingShell = () => (
	<div
		role="status"
		aria-busy="true"
		aria-label="Загрузка страницы"
		className="flex min-h-screen animate-pulse flex-col gap-4 px-4 pt-[calc(var(--safe-area-inset-top)+1rem)] pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]"
	>
		<div className="h-8 w-40 rounded-xl bg-card" />
		<div className="h-24 rounded-3xl bg-card" />
		<div className="h-24 rounded-3xl bg-card" />
		<div className="h-24 rounded-3xl bg-card" />
	</div>
)

const MordaContent = async ({ children }: { children: ReactNode }) => {
	const fetcher = new Fetcher()

	try {
		await Promise.all([
			fetcher.fetch(orpc.users.me),
			fetcher.fetch(orpc.system.getMaintenance),
		])
	} catch (error) {
		if (isUnauthorizedError(error)) {
			return <UnauthorizedPage />
		}

		throw error
	}

	return (
		<HydrationBoundary state={fetcher.dehydrate()}>
			<YandexMetrikaUser />
			<MaintenanceGate>
				{children}
				<MainTabBar />
			</MaintenanceGate>
		</HydrationBoundary>
	)
}

export default function MordaLayout({ children }: { children: ReactNode }) {
	return (
		<Suspense fallback={<MordaLoadingShell />}>
			<MordaContent>{children}</MordaContent>
		</Suspense>
	)
}
