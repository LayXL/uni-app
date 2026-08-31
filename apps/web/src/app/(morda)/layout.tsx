import { HydrationBoundary } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { orpc } from "@repo/orpc/react"

import { UnauthorizedPage } from "@/shared/ui/unauthorized-page"
import { Fetcher } from "@/shared/utils/fetcher"
import { isUnauthorizedError } from "@/shared/utils/is-unauthorized-error"

import { MaintenanceGate } from "./_ui/maintenance-gate"
import { YandexMetrikaUser } from "./_ui/yandex-metrika-user"

export default async function ({ children }: { children: ReactNode }) {
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
			<MaintenanceGate>{children}</MaintenanceGate>
		</HydrationBoundary>
	)
}
