import { useQueries } from "@tanstack/react-query"
import {
	createFileRoute,
	Navigate,
	Outlet,
	useLocation,
} from "@tanstack/react-router"

import { GUEST_USER_ID } from "@repo/orpc/client"
import { orpc } from "@repo/orpc/react"

import { MainTabBar } from "@/app/(morda)/_ui/main-tab-bar"
import { MaintenanceGate } from "@/app/(morda)/_ui/maintenance-gate"
import { YandexMetrikaUser } from "@/app/(morda)/_ui/yandex-metrika-user"
import { SessionMap } from "@/app/(morda)/map/_ui/session-map"
import { AppVisitRegistration } from "@/features/schedule/hooks/use-app-visit"
import { useIsClient } from "@/shared/hooks/use-is-client"
import { PageSkeleton } from "@/shared/ui/page-skeleton"

export const Route = createFileRoute("/_app")({
	component: AppLayout,
})

function AppLayout() {
	return (
		<div className="mx-auto w-full max-w-(--page-max-width)">
			<SessionApp />
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

function SessionApp() {
	const isClient = useIsClient()
	const pathname = useLocation({ select: (location) => location.pathname })
	const results = useQueries({
		queries: [
			{ ...orpc.users.me.queryOptions(), enabled: isClient },
			{ ...orpc.system.getMaintenance.queryOptions(), enabled: isClient },
		],
	})
	const error = results.find((result) => result.error)?.error

	if (error) {
		throw error
	}

	if (!isClient || results.some((result) => result.isPending)) {
		return <MordaLoadingShell />
	}

	if (
		results[0].data?.id === GUEST_USER_ID &&
		(pathname === "/onboarding" ||
			pathname === "/onboarding/" ||
			pathname === "/homework" ||
			pathname.startsWith("/homework/"))
	) {
		return <Navigate to="/" replace />
	}

	return (
		<>
			<YandexMetrikaUser />
			<AppVisitRegistration />
			<MaintenanceGate>
				<Outlet />
				<SessionMap />
				<MainTabBar />
			</MaintenanceGate>
		</>
	)
}
