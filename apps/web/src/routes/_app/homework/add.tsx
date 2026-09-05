import { createFileRoute } from "@tanstack/react-router"

import AddHomeworkPage from "@/app/(morda)/homework/add/page"

export const Route = createFileRoute("/_app/homework/add")({
	component: AddHomeworkPage,
})
