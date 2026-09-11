import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react"
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react"

import { LiquidBorder } from "@/shared/ui/liquid-border"
import { Touchable } from "@/shared/ui/touchable"
import { cn } from "@/shared/utils/cn"

import {
	getAdjacentDate,
	getDayDragOffset,
	getSwipeDayOffset,
} from "../lib/day-navigation"

export const ScheduleDayView = ({
	dates,
	selectedDate,
	today,
	onSelect,
	renderDay,
}: {
	dates: string[]
	selectedDate: string
	today: string
	onSelect: (date: string) => void
	renderDay: (date: string) => ReactNode
}) => {
	const [showLeftGradient, setShowLeftGradient] = useState(false)
	const [showRightGradient, setShowRightGradient] = useState(false)
	const x = useMotionValue(0)
	const shouldReduceMotion = useReducedMotion()
	const animation = useRef<ReturnType<typeof animate> | null>(null)
	const isSettling = useRef(false)
	const selectedIndex = dates.indexOf(selectedDate)
	const stripRef = useRef<HTMLDivElement>(null)
	const selectedRef = useRef<HTMLButtonElement>(null)
	const gesture = useRef<{
		x: number
		y: number
		id: number
		horizontal: boolean
		width: number
	} | null>(null)
	const suppressClick = useRef(false)
	const settle = (offset: number, width: number) => {
		const nextDate = getAdjacentDate(dates, selectedDate, offset)
		const changesDay = nextDate !== selectedDate
		isSettling.current = true
		animation.current?.stop()
		animation.current = animate(x, changesDay ? -offset * width : 0, {
			...(shouldReduceMotion
				? { duration: 0 }
				: { type: "spring", stiffness: 500, damping: 38, mass: 0.7 }),
			onComplete: () => {
				if (changesDay) onSelect(nextDate)
				else isSettling.current = false
			},
		})
	}

	useLayoutEffect(() => {
		if (!selectedDate) return
		animation.current?.stop()
		x.jump(0)
		gesture.current = null
		isSettling.current = false
	}, [selectedDate, x])

	useEffect(() => {
		const reset = () => {
			animation.current?.stop()
			x.jump(0)
			gesture.current = null
			isSettling.current = false
		}
		window.addEventListener("resize", reset)
		return () => {
			animation.current?.stop()
			window.removeEventListener("resize", reset)
		}
	}, [x])

	useEffect(() => {
		const strip = stripRef.current
		if (!strip) return
		const updateGradients = () => {
			setShowLeftGradient(strip.scrollLeft > 1)
			setShowRightGradient(
				strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1,
			)
		}
		updateGradients()
		const observer = new ResizeObserver(updateGradients)
		observer.observe(strip)
		strip.addEventListener("scroll", updateGradients, { passive: true })
		return () => {
			observer.disconnect()
			strip.removeEventListener("scroll", updateGradients)
		}
	}, [])

	useEffect(() => {
		const strip = stripRef.current
		const selected = selectedRef.current
		if (strip && selected && selectedDate) {
			strip.scrollTo({
				behavior: shouldReduceMotion ? "auto" : "smooth",
				left:
					selected.offsetLeft -
					strip.clientWidth / 2 +
					selected.clientWidth / 2,
			})
		}
	}, [selectedDate, shouldReduceMotion])

	return (
		<div className="flex flex-1 flex-col gap-4">
			<div className="relative">
				<div
					ref={stripRef}
					role="group"
					aria-label="Выбор дня"
					className="relative flex gap-1 overflow-x-auto overscroll-x-contain px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:[scrollbar-width:auto] sm:[&::-webkit-scrollbar]:block"
				>
					{dates.map((date) => (
						<Touchable key={date}>
							<button
								ref={date === selectedDate ? selectedRef : undefined}
								type="button"
								aria-label={format(parseISO(date), "d MMMM, EEEE", {
									locale: ru,
								})}
								aria-pressed={date === selectedDate}
								aria-current={date === today ? "date" : undefined}
								onClick={() => onSelect(date)}
								className={cn(
									"relative flex shrink-0 items-end gap-1 rounded-3xl bg-card px-3 py-2 transition-colors",
									date === selectedDate && "bg-accent text-accent-foreground",
								)}
							>
								<LiquidBorder />
								<span>{format(parseISO(date), "dd.MM")}</span>
								<span
									className={cn(
										"text-sm text-muted transition-colors",
										date === selectedDate && "text-accent-foreground",
									)}
								>
									{format(parseISO(date), "eeeeee", { locale: ru })}
								</span>
							</button>
						</Touchable>
					))}
				</div>
				<motion.div
					aria-hidden="true"
					initial={false}
					animate={{ opacity: showLeftGradient ? 1 : 0 }}
					className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-background to-transparent"
				/>
				<motion.div
					aria-hidden="true"
					initial={false}
					animate={{ opacity: showRightGradient ? 1 : 0 }}
					className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent"
				/>
			</div>
			<div
				className="relative flex min-w-0 flex-1 flex-col overflow-x-clip touch-pan-y"
				onPointerDown={(event) => {
					if (
						isSettling.current ||
						!event.isPrimary ||
						event.button !== 0 ||
						!event.currentTarget.contains(event.target as Node)
					)
						return
					suppressClick.current = false
					gesture.current = {
						x: event.clientX,
						y: event.clientY,
						id: event.pointerId,
						horizontal: false,
						width: event.currentTarget.clientWidth,
					}
				}}
				onPointerMove={(event) => {
					const start = gesture.current
					if (!start || start.id !== event.pointerId) return
					const dx = event.clientX - start.x
					const dy = event.clientY - start.y
					if (
						!start.horizontal &&
						Math.abs(dy) > 12 &&
						Math.abs(dy) >= Math.abs(dx)
					) {
						gesture.current = null
						suppressClick.current = true
						return
					}
					if (
						!start.horizontal &&
						Math.abs(dx) > 8 &&
						Math.abs(dx) > Math.abs(dy) * 1.5
					) {
						start.horizontal = true
						suppressClick.current = true
						event.currentTarget.setPointerCapture(event.pointerId)
					}
					if (start.horizontal) {
						x.set(
							getDayDragOffset(
								dx,
								start.width,
								selectedIndex > 0,
								selectedIndex < dates.length - 1,
							),
						)
					}
				}}
				onPointerUp={(event) => {
					const start = gesture.current
					if (!start || start.id !== event.pointerId) return
					gesture.current = null
					if (!start.horizontal) return
					suppressClick.current = true
					settle(
						getSwipeDayOffset(event.clientX - start.x, event.clientY - start.y),
						start.width,
					)
				}}
				onPointerCancel={(event) => {
					const start = gesture.current
					if (!start || start.id !== event.pointerId) return
					gesture.current = null
					if (start.horizontal) settle(0, start.width)
				}}
				onLostPointerCapture={(event) => {
					const start = gesture.current
					if (!start || start.id !== event.pointerId) return
					gesture.current = null
					if (start.horizontal) settle(0, start.width)
				}}
				onClickCapture={(event) => {
					if (suppressClick.current || isSettling.current) {
						event.preventDefault()
						event.stopPropagation()
						suppressClick.current = false
					}
				}}
			>
				<motion.div
					style={{ x }}
					className="relative flex w-full flex-1 flex-col"
				>
					{[-1, 0, 1].map((offset) => {
						const date = dates[selectedIndex + offset]
						if (!date) return null
						return (
							<div
								key={date}
								inert={offset !== 0}
								aria-hidden={offset !== 0 ? true : undefined}
								className={cn(
									"flex w-full flex-col",
									offset === 0
										? "relative flex-1"
										: "absolute inset-y-0 overflow-hidden",
								)}
								style={{ left: `${offset * 100}%` }}
							>
								{renderDay(date)}
							</div>
						)
					})}
				</motion.div>
			</div>
		</div>
	)
}
