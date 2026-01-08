import { skipToken, useQuery } from "@tanstack/react-query"
import { formatISO } from "date-fns"
import { Fragment, useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

import { orpc } from "@repo/orpc/react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

import { useRouteBuilder } from "../hooks/use-route-builder"

export const RouteBuilderSuggestions = () => {
	const { setStartRoomId, setStart, setEndRoomId, setEnd } = useRouteBuilder(
		useShallow((state) => ({
			setStartRoomId: state.setStartRoomId,
			setStart: state.setStart,
			setEndRoomId: state.setEndRoomId,
			setEnd: state.setEnd,
		})),
	)

	const { data: mapData } = useQuery(orpc.map.getMap.queryOptions())

	const user = useUser()

	const { data: todaySchedule } = useQuery(
		orpc.schedule.getSchedule.queryOptions({
			input: user.group
				? {
						dates: [formatISO(new Date(), { representation: "date" })],
						group: user.group.id,
					}
				: skipToken,
		}),
	)

	const suggestions = todaySchedule?.reduce(
		(acc, lesson, index) => {
			const roomId = mapData?.rooms.find(
				(room) => room.name === lesson.classroom,
			)?.id

			if (roomId) {
				acc.push({
					from: acc[index - 1]?.to ?? -1,
					to: roomId,
				})
			}
			return acc
		},
		[] as { from: number; to: number }[],
	)

	const roomItems = useMemo(
		() => new Map((mapData?.rooms ?? []).map((room) => [room.id, room])),
		[mapData?.rooms],
	)

	return (
		<div className="flex flex-col bg-popover border border-border rounded-xl">
			{suggestions?.map((suggestion, i) => (
				<Fragment key={i}>
					<Touchable>
						<button
							type="button"
							className="flex items-center gap-4 px-4 py-3"
							onClick={() => {
								//
							}}
						>
							<div>
								<Icon name="iconify:material-symbols:auto-awesome" size={20} />
							</div>
							<div className="flex items-center gap-2">
								<span>
									{suggestion.from === -1
										? "Главный вход"
										: roomItems.get(suggestion.from)?.name}
								</span>
								<Icon
									name="iconify:material-symbols:arrow-forward-rounded"
									size={20}
									className="bg-muted-foreground"
								/>
								<span>{roomItems.get(suggestion.to)?.name}</span>
							</div>
						</button>
					</Touchable>
					{i < suggestions.length - 1 && (
						<div className="h-px ml-13 bg-border" />
					)}
				</Fragment>
			))}
		</div>
	)
}
