import type { ClassValue } from "clsx"
import { cloneElement, type ReactElement, type ReactNode } from "react"

import { cn } from "../utils/cn"
import { type HapticType, haptic } from "../utils/haptic"

interface TouchableProps {
	children: ReactElement<
		{ className?: ClassValue; onClick: (e?: React.MouseEvent) => void } & {
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
				"cursor-pointer active:brightness-60 transition-[filter]",
				children.props.className,
			),
			onClick: (e: React.MouseEvent<Element, MouseEvent> | undefined) => {
				haptic(hapticType ?? "light")
				children.props.onClick?.(e)
			},
		},
		children.props.children,
	)
}
