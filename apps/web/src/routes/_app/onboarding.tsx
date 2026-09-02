import { createFileRoute } from "@tanstack/react-router"

import OnboardingPage from "@/app/(morda)/onboarding/page"

export const Route = createFileRoute("/_app/onboarding")({
	component: OnboardingPage,
})
