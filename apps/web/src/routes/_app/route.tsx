import { useQueries } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"

import { orpc } from "@repo/orpc/react"

import { MainTabBar } from "@/app/(morda)/_ui/main-tab-bar"
import { MaintenanceGate } from "@/app/(morda)/_ui/maintenance-gate"
import { YandexMetrikaUser } from "@/app/(morda)/_ui/yandex-metrika-user"
import { UnauthorizedPage } from "@/shared/ui/unauthorized-page"
import { isUnauthorizedError } from "@/shared/utils/is-unauthorized-error"

export const Route = createFileRoute("/_app")({
	component: AuthenticatedApp,
})

function MordaLoadingShell() {
	return (
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
}

function AuthenticatedApp() {
	const results = useQueries({
		queries: [
			orpc.users.me.queryOptions(),
			orpc.system.getMaintenance.queryOptions(),
		],
	})
	const error = results.find((result) => result.error)?.error

	if (error) {
		if (isUnauthorizedError(error)) return <UnauthorizedPage />
		throw error
	}

	if (results.some((result) => result.isPending)) {
		return <MordaLoadingShell />
	}

	return (
		<>
			<YandexMetrikaUser />
			<MaintenanceGate>
				<Outlet />
				<MainTabBar />
			</MaintenanceGate>
		</>
	)
}
