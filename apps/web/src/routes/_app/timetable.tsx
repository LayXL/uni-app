import { createFileRoute } from "@tanstack/react-router"

import { TimetablePage } from "@/features/schedule/ui/timetable-page"

export const Route = createFileRoute("/_app/timetable")({
	head: () => ({
		meta: [{ title: "Расписание звонков — Мэпп" }],
	}),
	component: TimetablePage,
})
