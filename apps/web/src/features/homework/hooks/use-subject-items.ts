import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import { getNextTwoWeeksDates } from "@repo/shared/lessons/get-next-two-weeks-dates"
import { isTestingGroupId } from "@repo/shared/testing-group"

import { useUser } from "@/entities/user/hooks/useUser"
import { useScheduleGroup } from "@/features/schedule/hooks/use-schedule-group"
import type { SearchInputItem } from "@/shared/ui/search-input"

type ExtraSubject = { id: number; name: string }

export function useSubjectItems(extraSubjects?: ExtraSubject[]) {
	const user = useUser()
	const { group } = useScheduleGroup()
	const dates = useMemo(() => getNextTwoWeeksDates(), [])
	const scheduleGroup = isTestingGroupId(group?.id) ? group?.id : user.group?.id

	const schedule = useQuery({
		...orpc.schedule.getSchedule.queryOptions({
			input: { dates, group: scheduleGroup },
		}),
		enabled: !!scheduleGroup,
	})

	return useMemo<SearchInputItem<number>[]>(() => {
		const seen = new Map<number, string>()

		if (schedule.data) {
			for (const lesson of schedule.data) {
				if (!seen.has(lesson.subject.id)) {
					seen.set(lesson.subject.id, lesson.subject.name)
				}
			}
		}

		if (extraSubjects) {
			for (const s of extraSubjects) {
				if (!seen.has(s.id)) {
					seen.set(s.id, s.name)
				}
			}
		}

		return Array.from(seen.entries()).map(([id, name]) => ({
			key: id,
			value: name,
		}))
	}, [schedule.data, extraSubjects])
}
