"use client"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"
import type { IconName } from "@/types/icon-name"

import { useRouteBuilder } from "../hooks/use-route-builder"
import { MapSearch } from "./map-search"

type MapBottomBarButtonProps = {
	icon: IconName
	label: string
	onClick?: () => void
}

const MapBottomBarButton = ({
	icon,
	label,
	onClick,
}: MapBottomBarButtonProps) => {
	return (
		<Touchable>
			<button
				type="button"
				aria-label={label}
				className="relative flex shrink-0 items-center justify-center size-12 rounded-3xl bg-background"
				onClick={onClick}
			>
				<LiquidBorder />
				<Icon name={icon} size={20} />
			</button>
		</Touchable>
	)
}

export const MapBottomBar = () => {
	const openRouteBuilderModal = useRouteBuilder((state) => state.openModal)

	return (
		<div className="flex gap-1">
			<MapSearch />
			<MapBottomBarButton
				icon="iconify:material-symbols:route"
				label="Построить маршрут"
				onClick={openRouteBuilderModal}
			/>
		</div>
	)
}
