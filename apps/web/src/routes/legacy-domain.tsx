import { createFileRoute } from "@tanstack/react-router"

import { LegacyDomainPage } from "@/shared/ui/legacy-domain-page"

export const Route = createFileRoute("/legacy-domain")({
	component: LegacyDomainPage,
})
