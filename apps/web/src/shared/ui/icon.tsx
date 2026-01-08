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

	const isIconify = props.name.startsWith("iconify:")
	const [_, namespace, icon] = isIconify
		? props.name.split(":")
		: [null, props.name]

	const url = isIconify
		? `https://api.iconify.design/${namespace}/${icon}.svg`
		: `/icons/${props.name}.svg`

	return (
		<span
			className={cn(
				"icon-mask block size-(--size) bg-current",
				props.className,
			)}
			style={{
				"--size": `${size}px`,
				WebkitMaskImage: `url(${url})`,
				maskImage: `url(${url})`,
				WebkitMaskSize: "var(--size)",
				maskSize: "var(--size)",
				color: props.color ?? "currentcolor",
			}}
		/>
	)
}
