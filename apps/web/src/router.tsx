import { createRouter } from "@tanstack/react-router"

import { routeTree } from "./routeTree.gen"

export const getRouter = () =>
	createRouter({
		routeTree,
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultPendingComponent: () => (
			<div
				role="status"
				aria-busy="true"
				aria-label="Загрузка приложения"
				className="min-h-screen bg-background"
			/>
		),
	})

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
