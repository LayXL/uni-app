"use client"

import { useState } from "react"

type TeacherScheduleProfileProps = {
	displayName: string
	avatarUrl: string | null
}

export const TeacherScheduleProfile = ({
	displayName,
	avatarUrl,
}: TeacherScheduleProfileProps) => {
	const [failedUrl, setFailedUrl] = useState<string | null>(null)
	const profile = displayName.match(/^(.+?)\s*\((.+)\)\s*$/)
	const name = (profile?.[1] ?? displayName).trim()
	const position = profile?.[2].trim()
	const initials = name
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")

	return (
		<header className="flex flex-col items-center gap-4 px-4 pt-4 pb-6 text-center">
			<div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card text-2xl font-semibold text-muted">
				<span aria-hidden="true">{initials}</span>
				{avatarUrl && avatarUrl !== failedUrl && (
					<img
						key={avatarUrl}
						src={avatarUrl}
						alt=""
						width={96}
						height={96}
						className="absolute inset-0 size-full object-cover object-top"
						onError={() => setFailedUrl(avatarUrl)}
					/>
				)}
			</div>
			<div className="flex max-w-full flex-col gap-1.5">
				<h1 className="text-2xl leading-tight font-semibold wrap-break-word text-balance">
					{name}
				</h1>
				{position && (
					<p className="text-sm leading-relaxed text-muted wrap-break-word text-balance">
						{position}
					</p>
				)}
			</div>
		</header>
	)
}
