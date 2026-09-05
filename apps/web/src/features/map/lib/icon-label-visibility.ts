import { type FabricObject, FabricText, Group } from "fabric"

// Show room names at the same scale used when focusing a room from search.
export const ICON_LABEL_MIN_ZOOM = 0.5

export const updateIconLabelVisibility = (icon: FabricObject, zoom: number) => {
	if (!(icon instanceof Group)) return

	const visible = zoom >= ICON_LABEL_MIN_ZOOM
	for (const child of icon.getObjects()) {
		if (child instanceof FabricText && child.visible !== visible) {
			child.set("visible", visible)
		}
	}
}
