"use client"

import { format } from "date-fns"

import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

type EventCardProps = {
	title: string
	description?: string | null
	coverImage?: string | null
	date: string | Date
	buttonUrl?: string | null
	buttonText?: string | null
}

export const EventCard = ({
	title,
	description,
	coverImage,
	date,
	buttonUrl,
	buttonText,
}: EventCardProps) => {
	const eventDate = new Date(date)
	const time = format(eventDate, "HH:mm")

	const content = (
		<div className="relative bg-card rounded-3xl overflow-hidden">
			<LiquidBorder variant="accent" />
			{coverImage && (
				<img
					src={coverImage}
					alt={title}
					draggable={false}
					className="w-full aspect-5/2 object-cover"
				/>
			)}
			<div className="p-3 flex flex-col gap-1.5">
				<div className="flex items-center gap-2">
					<Icon
						name="iconify:material-symbols:event-outline"
						size={18}
						className="text-accent shrink-0"
					/>
					<span className="text-sm text-muted">{time}</span>
				</div>
				<p className="font-medium">{title}</p>
				{description && (
					<p className="text-sm text-muted line-clamp-2">{description}</p>
				)}
				{buttonUrl && buttonText && (
					<Touchable>
						<a
							href={buttonUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-1 inline-flex items-center gap-1.5 text-sm text-accent font-medium"
						>
							{buttonText}
							<Icon name="iconify:material-symbols:arrow-outward" size={16} />
						</a>
					</Touchable>
				)}
			</div>
		</div>
	)

	return content
}
