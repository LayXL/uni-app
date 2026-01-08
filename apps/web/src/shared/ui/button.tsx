import type { ClassValue } from "clsx"
import {
	cloneElement,
	type HTMLAttributes,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react"

import type { IconName } from "@/types/icon-name"

import { cn } from "../utils/cn"
import { Icon } from "./icon"
import { Touchable } from "./touchable"

type ButtonProps = {
	variant?: "primary" | "secondary" | "accent"

	label?: string
	disabled?: boolean
	onClick?: () => void
	disableHaptic?: boolean
	className?: ClassValue

	leftIcon?: IconName
	rightIcon?: IconName
} & (
	| {
			asChild?: false
	  }
	| {
			asChild: true
			children: ReactNode
	  }
)

export const Button = (props: ButtonProps) => {
	const {
		variant = "primary",
		label,
		onClick,
		leftIcon,
		rightIcon,
		asChild,
	} = props

	const className = cn(
		"block truncate transition-[background-color,filter,color] cursor-pointer",

		"flex gap-2 items-center justify-center p-4 rounded-2xl font-medium",

		variant === "accent" && "bg-accent text-accent-foreground",
		variant === "primary" && "bg-primary text-primary-foreground",
		variant === "secondary" && "bg-secondary text-secondary-foreground",

		props.disabled && "pointer-events-none",
		props.className,
	)

	const children =
		leftIcon || rightIcon ? (
			<>
				{leftIcon && <Icon name={leftIcon} size={20} />}
				{label}
				{rightIcon && <Icon name={rightIcon} size={20} />}
			</>
		) : (
			label
		)

	const childProps = {
		className,
		onClick: () => {
			onClick?.()
			// if (props.disableHaptic !== true) haptic("light")
		},
		children,
	}

	if (asChild) {
		if (!isValidElement(props.children)) {
			throw new Error("Button with asChild requires a single element")
		}

		const child = props.children as ReactElement<HTMLAttributes<HTMLDivElement>>

		return cloneElement(child, {
			...child.props,
			...childProps,
		})
	}

	return (
		<Touchable>
			<button disabled={props.disabled} type="button" {...childProps} />
		</Touchable>
	)
}
