import type { ClassValue } from "clsx"
import { cloneElement, type ReactElement, type ReactNode } from "react"

import { cn } from "../utils/cn"
import { type HapticType, haptic } from "../utils/haptic"

interface TouchableProps {
	children: ReactElement<
		{
			className?: ClassValue
			onClickCapture?: React.MouseEventHandler<Element>
		} & {
			children?: ReactNode
		}
	>
	hapticType?: HapticType
}

export const Touchable = ({ children, hapticType }: TouchableProps) => {
	return cloneElement(
		children,
		{
			className: cn(
				"cursor-pointer active:brightness-80 transition-[filter]",
				children.props.className,
			),
			onClickCapture: (event: React.MouseEvent<Element>) => {
				children.props.onClickCapture?.(event)
				setTimeout(() => haptic(hapticType ?? "light"), 0)
			},
		},
		children.props.children,
	)
}
