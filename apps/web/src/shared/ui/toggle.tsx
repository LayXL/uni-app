import { cn } from "../utils/cn"
import { LiquidBorder } from "./liquid-border"
import { Touchable } from "./touchable"

type ToggleProps = {
	value: boolean
	onChange: (value: boolean) => void
	className?: string
	ariaLabel?: string
	disabled?: boolean
}

export function Toggle({
	value,
	onChange,
	className,
	ariaLabel,
	disabled,
}: ToggleProps) {
	return (
		<Touchable>
			<button
				type="button"
				role="switch"
				disabled={disabled}
				aria-checked={value}
				aria-label={ariaLabel}
				onClick={() => onChange(!value)}
				className={cn(
					"relative w-12 h-7 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60",
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
