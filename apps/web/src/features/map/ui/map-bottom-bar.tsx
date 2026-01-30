"use client"

import { useState } from "react"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"
import type { IconName } from "@/types/icon-name"

import { useRouteBuilder } from "../hooks/use-route-builder"

import { MapSearchModal } from "./map-search-modal"

type MapBottomBarButtonProps = {
	icon: IconName
	onClick?: () => void
}

const MapBottomBarButton = ({ icon, onClick }: MapBottomBarButtonProps) => {
	return (
		<Touchable>
			<button
				type="button"
				className="relative flex items-center justify-center size-12 rounded-3xl bg-background"
				onClick={onClick}
			>
				<LiquidBorder degree={45} />
				<Icon name={icon} size={20} />
			</button>
		</Touchable>
	)
}

export const MapBottomBar = () => {
	const openRouteBuilderModal = useRouteBuilder((state) => state.openModal)

	const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

	return (
		<div className="flex gap-1">
			<MapBottomBarButton
				icon="iconify:material-symbols:search-rounded"
				onClick={() => setIsSearchModalOpen(true)}
			/>
			<MapBottomBarButton
				icon="iconify:material-symbols:route"
				onClick={openRouteBuilderModal}
			/>
			<MapSearchModal
				isOpen={isSearchModalOpen}
				onClose={() => setIsSearchModalOpen(false)}
			/>
		</div>
	)
}
