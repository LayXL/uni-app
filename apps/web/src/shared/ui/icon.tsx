import type { ClassValue } from "clsx"

import type { IconName } from "@/types/icon-name"

import { cn } from "../utils/cn"

export type IconProps = {
	name: IconName
	size?: number
	color?: string
	className?: ClassValue
}

export const Icon = (props: IconProps) => {
	const size = props.size ?? Number(props.name.slice(-2))

	return (
		<span
			className={cn(
				"icon-mask block size-(--size) bg-current",
				props.className,
			)}
			style={{
				"--size": `${size}px`,
				WebkitMaskImage: `url(/icons/${props.name}.svg)`,
				maskImage: `url(/icons/${props.name}.svg)`,
				WebkitMaskSize: "var(--size)",
				maskSize: "var(--size)",
				color: props.color ?? "currentcolor",
			}}
		/>
	)
}
