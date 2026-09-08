type LabelBox = {
	x: number
	y: number
	w: number
	h: number
	selected?: boolean
	wasVisible: boolean
}

// Input is ordered by selection and priority. Offscreen labels still reserve their
// space: panning must not change which of two overlapping labels wins.
export const resolveLabelCollisions = (labels: LabelBox[]): boolean[] => {
	const occupied: LabelBox[] = []
	return labels.map((label) => {
		// Require a little more room to reappear than to remain visible.
		const margin = label.wasVisible ? 0 : 4
		const collides = occupied.some(
			(other) =>
				Math.abs(label.x - other.x) < (label.w + other.w) / 2 + margin - 1e-6 &&
				Math.abs(label.y - other.y) < (label.h + other.h) / 2 + margin - 1e-6,
		)
		const visible = Boolean(label.selected) || !collides
		if (visible) occupied.push(label)
		return visible
	})
}

// Keep partially clipped labels visible; hide only once the whole box has left.
export const isLabelInViewport = (
	label: Pick<LabelBox, "x" | "y" | "w" | "h">,
	width: number,
	height: number,
) =>
	label.x + label.w / 2 >= 0 &&
	label.x - label.w / 2 <= width &&
	label.y + label.h / 2 >= 0 &&
	label.y - label.h / 2 <= height
