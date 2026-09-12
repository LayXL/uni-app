import type { CardSettings } from "@repo/shared/lessons/card-settings"

import { LiquidBorder } from "@/shared/ui/liquid-border"
import { cn } from "@/shared/utils/cn"
import { haptic } from "@/shared/utils/haptic"

export const ScheduleViewMode = ({
	value,
	onChange,
	disabled,
}: {
	value: CardSettings["viewMode"]
	onChange: (value: CardSettings["viewMode"]) => void
	disabled?: boolean
}) => (
	<div
		role="group"
		aria-label="Вид расписания"
		className="relative flex rounded-2xl bg-card p-1"
	>
		<LiquidBorder />
		{(
			[
				{ value: "list", label: "Списком" },
				{ value: "day", label: "По дням" },
			] as const
		).map((option) => (
			<button
				key={option.value}
				type="button"
				aria-pressed={value === option.value}
				disabled={disabled}
				onClick={() => {
					haptic("selection")
					onChange(option.value)
				}}
				className={cn(
					"flex-1 rounded-xl px-3 py-2 text-center text-sm font-medium transition-colors disabled:opacity-60",
					value === option.value
						? "bg-background text-foreground shadow-sm"
						: "text-muted",
				)}
			>
				{option.label}
			</button>
		))}
	</div>
)
