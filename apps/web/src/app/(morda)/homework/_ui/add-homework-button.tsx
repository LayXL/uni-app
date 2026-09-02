"use client"

import Link from "next/link"

import { Button } from "@/shared/ui/button"

export function AddHomeworkButton() {
	return (
		<div className="fixed right-4 bottom-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.5rem)] z-20">
			<Button asChild leftIcon="add-16">
				<Link href="/homework/add" aria-label="Добавить домашнее задание" />
			</Button>
		</div>
	)
}
