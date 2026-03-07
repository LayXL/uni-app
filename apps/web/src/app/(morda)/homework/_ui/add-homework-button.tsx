import Link from "next/link"

import { Button } from "@/shared/ui/button"

export function AddHomeworkButton() {
	return (
		<div className="fixed bottom-4 right-4 z-10">
			<Button asChild leftIcon="add-16">
				<Link href="/homework/add" />
			</Button>
		</div>
	)
}
