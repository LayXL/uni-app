"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { MaintenancePage } from "@/shared/ui/maintenance-page"

type MaintenanceGateProps = {
	children: ReactNode
}

export function MaintenanceGate({ children }: MaintenanceGateProps) {
	const user = useUser()
	const { data: maintenance } = useSuspenseQuery({
		...orpc.system.getMaintenance.queryOptions(),
		refetchInterval: user.isAdmin ? false : 30_000,
	})

	if (maintenance.enabled && !user.isAdmin) {
		return (
			<MaintenancePage
				title={maintenance.title}
				description={maintenance.description}
			/>
		)
	}

	return children
}
