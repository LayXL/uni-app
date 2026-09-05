import { useNowInYekaterinburg } from "@/shared/hooks/use-now-in-yekaterinburg"

import { formatOpeningTime } from "../lib/format-opening-time"
import { getOpeningHoursStatus } from "../lib/get-opening-hours-status"
import { roomOpeningHours } from "../lib/room-opening-hours"

type RoomOpeningHoursProps = {
	roomId?: number
}

export const RoomOpeningHours = ({ roomId }: RoomOpeningHoursProps) => {
	const now = useNowInYekaterinburg()
	const openingHours = roomId != null ? roomOpeningHours[roomId] : undefined
	if (!openingHours) return null

	return (
		<section className="flex flex-col gap-2">
			<p role="status" className="text-sm text-muted">
				{getOpeningHoursStatus(openingHours, now)}
			</p>
			<dl className="divide-y divide-border">
				{openingHours.map(({ days, hours, breaks }) => (
					<div
						key={days}
						className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-2 last:pb-0 text-sm"
					>
						<dt className="text-muted">{days}</dt>
						<dd className="min-w-0 text-right tabular-nums">
							<span className="font-medium whitespace-nowrap">
								{hours
									? `${formatOpeningTime(hours.start)} – ${formatOpeningTime(hours.end)}`
									: "Выходной"}
							</span>
							{breaks?.map(({ label, start, end }) => (
								<p key={label} className="mt-0.5 text-xs text-muted">
									{label}:{" "}
									<span className="whitespace-nowrap">
										{formatOpeningTime(start)} – {formatOpeningTime(end)}
									</span>
								</p>
							))}
						</dd>
					</div>
				))}
			</dl>
		</section>
	)
}
