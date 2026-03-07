import type { ReactNode } from "react"

import { cn } from "../utils/cn"
import { LiquidBorder } from "./liquid-border"

type FormFieldProps = {
	label: string
	required?: boolean
	/** Wrap children in a bg-card + LiquidBorder card */
	card?: boolean
	className?: string
	children: ReactNode
}

export function FormField({
	label,
	required,
	card = false,
	className,
	children,
}: FormFieldProps) {
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<span className="text-sm text-muted">
				{label}
				{required && <span className="text-destructive"> *</span>}
			</span>
			{card ? (
				<div className="relative rounded-3xl overflow-hidden">
					<LiquidBorder />
					{children}
				</div>
			) : (
				children
			)}
		</div>
	)
}
