"use client"

import { Popover } from "@base-ui/react/popover"
import { format, isValid, parseISO, startOfDay } from "date-fns"
import { type Ref, useState } from "react"
import { DayPicker } from "react-day-picker"
import { ru } from "react-day-picker/locale"

import { cn } from "../utils/cn"
import { getClientTestNow } from "../utils/test-time"
import { Icon } from "./icon"

type DatePickerProps = {
	value: string
	onChange: (value: string) => void
	onBlur?: () => void
	name?: string
	id?: string
	ref?: Ref<HTMLButtonElement>
	disabled?: boolean
	invalid?: boolean
	ariaLabel?: string
}

const navigationButtonClass =
	"absolute top-0 flex size-11 items-center justify-center rounded-xl hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"

export function DatePicker({
	value,
	onChange,
	onBlur,
	name,
	id,
	ref,
	disabled,
	invalid,
	ariaLabel = "Дата",
}: DatePickerProps) {
	const [open, setOpen] = useState(false)
	const parsed = value ? parseISO(value) : undefined
	const selected = parsed && isValid(parsed) ? parsed : undefined
	const today = startOfDay(getClientTestNow())
	const formattedDate = selected
		? format(selected, "d MMMM yyyy", { locale: ru })
		: "Выбери дату"

	return (
		<Popover.Root
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen)
				if (!nextOpen) onBlur?.()
			}}
		>
			{name && <input type="hidden" name={name} value={value} />}
			<Popover.Trigger
				id={id}
				ref={ref}
				disabled={disabled}
				onBlur={onBlur}
				aria-label={`${ariaLabel}: ${formattedDate}`}
				aria-invalid={invalid || undefined}
				className={cn(
					"flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-3xl bg-card p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
					!selected && "text-muted",
					invalid && "ring-1 ring-inset ring-destructive",
				)}
			>
				<span>{formattedDate}</span>
				<Icon
					name="iconify:material-symbols:calendar-today"
					size={20}
					className="shrink-0 text-muted"
				/>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner
					align="start"
					positionMethod="fixed"
					sideOffset={8}
					collisionPadding={12}
					collisionAvoidance={{
						side: "shift",
						align: "shift",
						fallbackAxisSide: "none",
					}}
					className="z-50"
				>
					<Popover.Popup
						initialFocus={false}
						className="w-80 max-w-(--available-width) rounded-3xl border border-border bg-card p-3 text-foreground shadow-xl outline-none [--calendar-row-size:clamp(1.75rem,calc((100dvh_-_9rem)/6),2.75rem)]"
					>
						<Popover.Title className="sr-only">{ariaLabel}</Popover.Title>
						<DayPicker
							mode="single"
							required
							autoFocus
							locale={ru}
							weekStartsOn={1}
							today={today}
							disabled={{ before: today }}
							startMonth={today}
							defaultMonth={selected ?? today}
							selected={selected}
							onSelect={(date) => {
								onChange(format(date, "yyyy-MM-dd"))
								onBlur?.()
								setOpen(false)
							}}
							navLayout="around"
							showOutsideDays
							fixedWeeks
							classNames={{
								root: "w-full",
								months: "w-full",
								month: "relative w-full",
								month_caption: "flex h-11 items-center justify-center px-12",
								caption_label: "text-sm font-semibold capitalize",
								button_previous: cn(navigationButtonClass, "left-0"),
								button_next: cn(navigationButtonClass, "right-0"),
								chevron: "size-5 fill-current",
								month_grid: "mt-2 w-full table-fixed border-collapse",
								weekday: "h-8 text-center text-xs font-normal text-muted",
								day: "h-(--calendar-row-size) p-0 text-center",
								day_button:
									"mx-auto flex h-[min(2.5rem,var(--calendar-row-size))] w-10 max-w-full items-center justify-center rounded-xl text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
								selected:
									"[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:font-semibold",
								today:
									"[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-accent",
								outside: "text-muted",
								disabled: "opacity-40 [&>button]:cursor-not-allowed",
								hidden: "invisible",
							}}
						/>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	)
}
