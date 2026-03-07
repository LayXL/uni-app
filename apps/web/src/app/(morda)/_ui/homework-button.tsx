import Link from "next/link"

import { Button } from "@/shared/ui/button"

export function HomeworkButton() {
	return (
		<div className="fixed bottom-4 right-4 z-10">
			<Button asChild leftIcon="iconify:material-symbols:assignment">
				<Link href="/homework" />
			</Button>
		</div>
	)
}
