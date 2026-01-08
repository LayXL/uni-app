import { Icon } from "@/shared/ui/icon"
import type { IconName } from "@/types/icon-name"

type MapBottomBarButtonProps = {
	icon: IconName
	onClick?: () => void
}

const MapBottomBarButton = ({ icon, onClick }: MapBottomBarButtonProps) => {
	return (
		<button
			type="button"
			className="flex items-center justify-center size-12 rounded-2xl bg-background border border-border"
			onClick={onClick}
		>
			<Icon name={icon} size={20} />
		</button>
	)
}

export const MapBottomBar = () => {
	return (
		<div className="fixed bottom-4 left-0 right-0 px-3 py-2">
			<div className="flex gap-1">
				<MapBottomBarButton
					icon="iconify:material-symbols:search-rounded"
					onClick={() => {}}
				/>
				<MapBottomBarButton icon="route" onClick={() => {}} />
			</div>
		</div>
	)
}
