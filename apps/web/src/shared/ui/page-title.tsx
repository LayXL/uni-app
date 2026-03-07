"use client"

import { isVK } from "../utils/is-vk"
import { BackButton } from "./back-button"

type PageTitleProps = {
	title: string
}

export function PageTitle({ title }: PageTitleProps) {
	return (
		<div className="flex items-center gap-2 mb-4">
			{isVK && <BackButton />}
			<h1 className="text-xl font-bold">{title}</h1>
		</div>
	)
}
