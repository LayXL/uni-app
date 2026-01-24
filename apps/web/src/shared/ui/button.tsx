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
import { LiquidBorder } from "./liquid-border"
import { Touchable } from "./touchable"

type ButtonProps = {
	variant?: "primary" | "secondary" | "accent"
	size?: "sm" | "md" | "lg"

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
		variant = "accent",
		size = "md",
		label,
		onClick,
		leftIcon,
		rightIcon,
		asChild,
	} = props

	const className = cn(
		"block truncate transition-[background-color,filter,color] cursor-pointer relative",

		"flex gap-2 items-center justify-center p-4 rounded-3xl font-medium",

		variant === "accent" && "bg-accent text-accent-foreground",
		variant === "primary" && "bg-muted text-foreground",
		variant === "secondary" && "bg-card",

		size === "sm" && "p-2 text-sm",
		size === "md" && "p-4",
		size === "lg" && "p-6",

		props.disabled && "pointer-events-none bg-border",
		props.className,
	)

	const children = (
		<>
			<LiquidBorder variant={variant === "accent" ? "accent" : undefined} />
			{leftIcon && <Icon name={leftIcon} size={20} />}
			{label}
			{rightIcon && <Icon name={rightIcon} size={20} />}
		</>
	)

	const childProps = { className, onClick, children }

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
