"use client"

import { format } from "date-fns"
import Link from "next/link"

import { useUser } from "@/entities/user/hooks/useUser"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

type EventCardProps = {
	id: number
	title: string
	description?: string | null
	coverImage?: string | null
	date: string | Date
	buttonUrl?: string | null
	buttonText?: string | null
}

export const EventCard = ({
	id,
	title,
	description,
	coverImage,
	date,
	buttonUrl,
	buttonText,
}: EventCardProps) => {
	const user = useUser()
	const eventDate = new Date(date)
	const time = format(eventDate, "HH:mm")

	const content = (
		<div className="relative bg-card rounded-3xl overflow-hidden">
			<LiquidBorder variant="accent" />
			{coverImage && (
				<div className="p-px relative">
					<div className="flex items-center gap-1 absolute top-4 left-4 bg-card px-2 py-1 rounded-full">
						<LiquidBorder />
						<Icon
							name="iconify:material-symbols:event-outline"
							size={18}
							className="shrink-0"
						/>
						<span className="text-sm">{time}</span>
					</div>
					<img
						src={coverImage}
						alt={title}
						draggable={false}
						className="w-full aspect-5/2 object-cover rounded-3xl"
					/>
				</div>
			)}
			<div className="p-3 flex flex-col gap-1.5">
				<p className="font-medium">{title}</p>
				{!coverImage && (
					<div className="flex items-center gap-1">
						<Icon
							name="iconify:material-symbols:event-outline"
							size={18}
							className="shrink-0"
						/>
						<span className="text-sm">{time}</span>
					</div>
				)}
				{description && (
					<p className="text-sm text-muted line-clamp-2">{description}</p>
				)}
				{(buttonUrl && buttonText) || user.isAdmin ? (
					<div className="mt-1 flex items-center gap-3">
						{buttonUrl && buttonText && (
							<Touchable>
								<a
									href={buttonUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-sm text-accent font-medium"
								>
									{buttonText}
									<Icon
										name="iconify:material-symbols:arrow-outward"
										size={16}
									/>
								</a>
							</Touchable>
						)}
						{user.isAdmin && (
							<Touchable>
								<Link
									href={`/events/${id}/edit`}
									className="inline-flex items-center gap-1.5 text-sm text-muted font-medium"
								>
									<Icon
										name="iconify:material-symbols:edit-outline"
										size={16}
									/>
									Редактировать
								</Link>
							</Touchable>
						)}
					</div>
				) : null}
			</div>
		</div>
	)

	return content
}
