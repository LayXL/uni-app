import type { ReactNode } from "react"

export const PageSkeleton = ({
	title,
	label = "Загрузка страницы",
}: {
	title?: ReactNode
	label?: string
}) => (
	<div role="status" aria-busy="true" aria-label={label}>
		<div className="flex h-16 items-center justify-between gap-3 pl-4 pr-2">
			{title ? (
				<h2 className="min-w-0 flex-1 text-2xl font-semibold">{title}</h2>
			) : (
				<div className="h-8 w-40 motion-safe:animate-pulse rounded-xl bg-card" />
			)}
			<div className="h-10 min-w-26 shrink-0 motion-safe:animate-pulse rounded-3xl bg-card" />
		</div>
		<div
			aria-hidden="true"
			className="flex motion-safe:animate-pulse flex-col gap-4 px-2"
		>
			<div className="h-24 rounded-3xl bg-card" />
			<div className="h-40 rounded-3xl bg-card" />
			<div className="h-40 rounded-3xl bg-card" />
		</div>
	</div>
)
