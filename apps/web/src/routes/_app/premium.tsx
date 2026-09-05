import {
	createFileRoute,
	useCanGoBack,
	useRouter,
} from "@tanstack/react-router"

import { PremiumPage } from "@/features/premium/ui/premium-page"

export const Route = createFileRoute("/_app/premium")({
	head: () => ({
		meta: [{ title: "МЭПП+ — учёба с суперспособностями" }],
	}),
	component: PremiumRoute,
})

function PremiumRoute() {
	const router = useRouter()
	const canGoBack = useCanGoBack()

	const handleDismiss = () => {
		if (canGoBack) {
			router.history.back()
			return
		}
		void router.navigate({ to: "/", replace: true })
	}

	return <PremiumPage onDismiss={handleDismiss} />
}
