import type { InputHTMLAttributes } from "react"

import { cn } from "../utils/cn"

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = (props: InputProps) => {
	return (
		<input
			type="text"
			className={cn(
				"bg-card border border-border rounded-xl p-3",
				props.className,
			)}
			{...props}
		/>
	)
}
