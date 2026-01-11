import { cn } from "../utils/cn"

type LiquidBorderProps = {
	variant?: "primary" | "accent"
}

export const LiquidBorder = ({ variant = "primary" }: LiquidBorderProps) => {
	return (
		<div
			className={cn(
				"absolute inset-0 rounded-[inherit] backface-hidden pointer-events-none will-change-transform p-px",
				variant === "primary" &&
					"bg-linear-[8deg,transparent,#22222240_35%,#22222240_65%,transparent] dark:mix-blend-overlay dark:bg-linear-[8deg,transparent,#ffffffe6_35%,#ffffffe6_65%,transparent]",
				variant === "accent" &&
					"mix-blend-overlay bg-linear-[8deg,transparent,#ffffffe6_35%,#ffffffe6_65%,transparent]",
			)}
			style={{
				mask: "linear-gradient(#000,#000 0) content-box,linear-gradient(#000,#000 0)",
				maskComposite: "exclude",
			}}
		/>
	)
}
