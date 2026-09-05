"use client"

import { Link } from "@tanstack/react-router"

import { Button } from "@/shared/ui/button"

export function AddHomeworkButton() {
	return (
		<div className="fixed right-[max(1rem,calc((100%_-_var(--page-max-width))/2_+_1rem))] bottom-[calc(var(--tab-bar-height)+var(--safe-area-inset-bottom)+1.5rem)] z-20">
			<Button asChild leftIcon="add-16">
				<Link to="/homework/add" aria-label="Добавить домашнее задание" />
			</Button>
		</div>
	)
}
