"use client"

import { useState } from "react"

import "./schedule-timer-digits.css"

const TimerDigit = ({ value }: { value: string }) => {
	const [digits, setDigits] = useState({ current: value, previous: "" })

	if (digits.current !== value) {
		setDigits({ current: value, previous: digits.current })
	}

	return (
		<span
			className={`schedule-timer-digit t-digit-group${digits.previous ? " is-animating" : ""}`}
		>
			{digits.previous && (
				<span
					key={`out-${digits.current}`}
					className="schedule-timer-digit-out"
				>
					{digits.previous}
				</span>
			)}
			<span
				key={digits.current}
				className="t-digit"
				onAnimationEnd={(event) => {
					if (event.target === event.currentTarget) {
						setDigits((current) => ({ ...current, previous: "" }))
					}
				}}
			>
				<span className="schedule-timer-digit-glyph">{digits.current}</span>
			</span>
		</span>
	)
}

export const ScheduleTimerDigits = ({ time }: { time: string }) => (
	<span className="schedule-timer-digits text-2xl font-semibold tabular-nums">
		<span className="sr-only">{time}</span>
		<span aria-hidden="true" className="inline-flex items-baseline">
			{time.split("").map((character, index) =>
				character === ":" ? (
					<span key={time.length - index}>{character}</span>
				) : (
					// Keep each place mounted when hours or leading minutes disappear.
					<TimerDigit key={time.length - index} value={character} />
				),
			)}
		</span>
	</span>
)
