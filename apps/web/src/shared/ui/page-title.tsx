"use client"

import type { ClassValue } from "clsx"

import { cn } from "../utils/cn"
import { isVK } from "../utils/is-vk"
import { BackButton } from "./back-button"

type PageTitleProps = {
	title: string
	titleClassName?: ClassValue
}

export function PageTitle({ title, titleClassName }: PageTitleProps) {
	return (
		<div className="flex items-center gap-2 mb-4">
			{isVK() && <BackButton />}
			<h1 className={cn("text-xl font-bold", titleClassName)}>{title}</h1>
		</div>
	)
}
