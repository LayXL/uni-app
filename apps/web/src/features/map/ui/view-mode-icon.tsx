import { motion, useReducedMotion } from "motion/react"

// Matching path commands let Motion interpolate the outline and its three cutouts.
const cube = {
	outline:
		"M 4 17.7 Q 3.525 17.425 3.263 16.975 Q 3 16.525 3 15.975 L 3 8.025 Q 3 7.475 3.263 7.025 Q 3.525 6.575 4 6.3 L 11 2.275 Q 11.475 2 12 2 Q 12.525 2 13 2.275 L 20 6.3 Q 20.475 6.575 20.738 7.025 Q 21 7.475 21 8.025 L 21 15.975 Q 21 16.525 20.738 16.975 Q 20.475 17.425 20 17.7 L 13 21.725 Q 12.525 22 12 22 Q 11.475 22 11 21.725 Z",
	top: "M 12 10.85 L 17.925 7.425 L 12 4 L 6.075 7.425 Z",
	left: "M 11 19.425 L 11 12.575 L 5 9.1 L 5 15.95 Z",
	right: "M 13 19.425 L 19 15.95 L 19 9.1 L 13 12.575 Z",
}
const square = {
	outline:
		"M 3 21 Q 3 21 3 21 Q 3 21 3 21 L 3 3 Q 3 3 3 3 Q 3 3 3 3 L 12 3 Q 12 3 12 3 Q 12 3 12 3 L 21 3 Q 21 3 21 3 Q 21 3 21 3 L 21 21 Q 21 21 21 21 Q 21 21 21 21 L 12 21 Q 12 21 12 21 Q 12 21 12 21 Z",
	top: "M 5 19 L 19 19 L 19 5 L 5 5 Z",
	left: "M 5 19 L 5 19 L 5 19 L 5 19 Z",
	right: "M 19 19 L 19 19 L 19 19 L 19 19 Z",
}

export const ViewModeIcon = ({ view }: { view?: "3d" | "top" }) => {
	const reducedMotion = useReducedMotion()
	const shape = view === "3d" ? square : cube
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			aria-hidden="true"
			focusable="false"
		>
			<motion.path
				initial={false}
				animate={{
					d: `${shape.outline} ${shape.top} ${shape.left} ${shape.right}`,
				}}
				transition={{
					duration: reducedMotion ? 0 : 0.36,
					ease: [0.22, 1, 0.36, 1],
				}}
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	)
}
