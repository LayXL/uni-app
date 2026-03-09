"use client"

import { format } from "date-fns"
import Link from "next/link"
import type { CSSProperties } from "react"

import { useUser } from "@/entities/user/hooks/useUser"
import { Icon } from "@/shared/ui/icon"
import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"

type EventCardProps = {
	id: number
	title: string
	description?: string | null
	coverImage?: string | null
	backgroundColor?: string | null
	borderColor?: string | null
	textColor?: string | null
	buttonColor?: string | null
	date: string | Date
	buttonUrl?: string | null
	buttonText?: string | null
	hideEditButton?: boolean
}

export const EventCard = ({
	id,
	title,
	description,
	coverImage,
	backgroundColor,
	borderColor,
	textColor,
	buttonColor,
	date,
	buttonUrl,
	buttonText,
	hideEditButton = false,
}: EventCardProps) => {
	const user = useUser()
	const eventDate = new Date(date)
	const time = format(eventDate, "HH:mm")
	const hasCustomTextColor = Boolean(textColor)

	const containerStyle: CSSProperties = {
		...(backgroundColor ? { backgroundColor } : {}),
		...(borderColor ? { borderColor } : {}),
		...(textColor ? { color: textColor } : {}),
	}
	const textStyle = hasCustomTextColor
		? ({ color: textColor } as CSSProperties)
		: undefined
	const secondaryTextStyle = hasCustomTextColor
		? ({ color: textColor, opacity: 0.8 } as CSSProperties)
		: undefined
	const buttonStyle = buttonColor
		? ({ color: buttonColor } as CSSProperties)
		: textStyle

	const content = (
		<div
			className="relative bg-card rounded-3xl overflow-hidden border border-transparent"
			style={containerStyle}
		>
			{!borderColor && <LiquidBorder />}
			{coverImage && (
				<div className="p-px relative">
					<div
						className="flex items-center gap-1 absolute top-4 left-4 bg-card px-2 py-1 rounded-full"
						style={textStyle}
					>
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
				<p className="font-medium" style={textStyle}>
					{title}
				</p>
				{!coverImage && (
					<div className="flex items-center gap-1">
						<Icon
							name="iconify:material-symbols:event-outline"
							size={18}
							className="shrink-0"
						/>
						<span className="text-sm" style={textStyle}>
							{time}
						</span>
					</div>
				)}
				{description && (
					<p
						className="text-sm text-muted line-clamp-2"
						style={secondaryTextStyle}
					>
						{description}
					</p>
				)}
				{(buttonUrl && buttonText) || (user.isAdmin && !hideEditButton) ? (
					<div className="mt-1 flex items-center gap-3">
						{buttonUrl && buttonText && (
							<Touchable>
								<a
									href={buttonUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 text-sm text-accent font-medium"
									style={buttonStyle}
								>
									{buttonText}
									<Icon
										name="iconify:material-symbols:arrow-outward"
										size={16}
									/>
								</a>
							</Touchable>
						)}
						{user.isAdmin && !hideEditButton && (
							<Touchable>
								<Link
									href={`/events/${id}/edit`}
									className="inline-flex items-center gap-1.5 text-sm text-muted font-medium"
									style={secondaryTextStyle}
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
