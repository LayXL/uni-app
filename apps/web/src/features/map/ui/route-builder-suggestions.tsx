import { skipToken, useQuery } from "@tanstack/react-query"
import { formatISO } from "date-fns"
import { Fragment, useMemo } from "react"

import { orpc } from "@repo/orpc/react"
import type { MapEntity } from "@repo/shared/building-scheme"

import { useUser } from "@/entities/user/hooks/useUser"
import { Icon } from "@/shared/ui/icon"
import { Touchable } from "@/shared/ui/touchable"

import { useMapData } from "../hooks/use-map-data"
import type { CreateEntitySelectHandler } from "./route-builder-modal"

type RouteBuilderSuggestionsProps = {
	handleStartSelect: ReturnType<CreateEntitySelectHandler>
	handleEndSelect: ReturnType<CreateEntitySelectHandler>
	setIsActive: (isActive: boolean) => void
	closeModal: () => void
}

export const RouteBuilderSuggestions = ({
	handleStartSelect,
	handleEndSelect,
	setIsActive,
	closeModal,
}: RouteBuilderSuggestionsProps) => {
	const mapData = useMapData()
	const user = useUser()

	const entities = useMemo<MapEntity[]>(() => {
		if (!mapData?.entities) return []
		return mapData.entities
	}, [mapData?.entities])

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
			const entityId = entities.find((e) => e.name === lesson.classroom)?.id

			if (entityId) {
				acc.push({
					from: acc[index - 1]?.to ?? 166,
					to: entityId,
				})
			}
			return acc
		},
		[] as { from: number; to: number }[],
	)

	const entityItems = useMemo(
		() => new Map(entities.map((entity) => [entity.id, entity])),
		[entities],
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
								handleStartSelect(suggestion.from)
								handleEndSelect(suggestion.to)
								setIsActive(true)
								closeModal()
							}}
						>
							<div>
								<Icon name="iconify:material-symbols:auto-awesome" size={20} />
							</div>
							<div className="flex items-center gap-2">
								<span>{entityItems.get(suggestion.from)?.name}</span>
								<Icon
									name="iconify:material-symbols:arrow-forward-rounded"
									size={20}
									className="bg-muted-foreground"
								/>
								<span>{entityItems.get(suggestion.to)?.name}</span>
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
