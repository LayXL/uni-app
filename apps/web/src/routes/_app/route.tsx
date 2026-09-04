import { useQueries } from "@tanstack/react-query"
import { createFileRoute, Outlet } from "@tanstack/react-router"

import { orpc } from "@repo/orpc/react"

import { MainTabBar } from "@/app/(morda)/_ui/main-tab-bar"
import { MaintenanceGate } from "@/app/(morda)/_ui/maintenance-gate"
import { YandexMetrikaUser } from "@/app/(morda)/_ui/yandex-metrika-user"
import { PageSkeleton } from "@/shared/ui/page-skeleton"
import { UnauthorizedPage } from "@/shared/ui/unauthorized-page"
import { isUnauthorizedError } from "@/shared/utils/is-unauthorized-error"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

function AppLayout() {
	return (
		<div className="mx-auto w-full max-w-(--page-max-width)">
			<AuthenticatedApp />
		</div>
	)
}

function MordaLoadingShell() {
	return (
		<div className="flex min-h-screen flex-col pt-(--safe-area-inset-top) pb-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.75rem)]">
			<PageSkeleton />
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
