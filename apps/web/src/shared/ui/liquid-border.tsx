import { cn } from "../utils/cn"

type LiquidBorderProps = {
	variant?: "primary" | "accent"
}

export const LiquidBorder = ({ variant = "primary" }: LiquidBorderProps) => {
	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-0 rounded-[inherit] border",
				variant === "primary" && "border-border",
				variant === "accent" && "border-accent-foreground/50",
			)}
		/>
	)
}
