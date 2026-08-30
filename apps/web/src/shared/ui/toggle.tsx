import { cn } from "../utils/cn"
import { LiquidBorder } from "./liquid-border"
import { Touchable } from "./touchable"

type ToggleProps = {
	value: boolean
	onChange: (value: boolean) => void
	className?: string
	ariaLabel?: string
}

export function Toggle({ value, onChange, className, ariaLabel }: ToggleProps) {
	return (
		<Touchable>
			<button
				type="button"
				role="switch"
				aria-checked={value}
				aria-label={ariaLabel}
				onClick={() => onChange(!value)}
				className={cn(
					"relative w-12 h-7 rounded-full transition-colors",
					value ? "bg-accent" : "bg-border",
					className,
				)}
			>
				<LiquidBorder />
				<div
					className={cn(
						"absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow-sm",
						value ? "translate-x-[22px]" : "translate-x-0.5",
					)}
				/>
			</button>
		</Touchable>
	)
}
