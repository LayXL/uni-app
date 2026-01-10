"use client"

import {
	type InputHTMLAttributes,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"

import { cn } from "../utils/cn"
import { Touchable } from "./touchable"

export type SearchInputItem<T = string> = {
	key: T
	value: string
}

type SearchInputProps<T> = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"value" | "onChange"
> & {
	items: SearchInputItem<T>[]
	value?: T
	onChange?: (value: T) => void
	onInputChange?: (input: string) => void
	filterFn?: (item: SearchInputItem<T>, query: string) => boolean
	maxSuggestions?: number
	emptyMessage?: string
}

export const SearchInput = <T,>(props: SearchInputProps<T>) => {
	const {
		items,
		value,
		onChange,
		onInputChange,
		filterFn,
		maxSuggestions = 5,
		emptyMessage = "Ничего не найдено",
		className,
		...inputProps
	} = props

	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState("")
	const [highlightedIndex, setHighlightedIndex] = useState(0)

	// Sync input with selected value
	useEffect(() => {
		if (value !== undefined) {
			const selectedItem = items.find((item) => item.key === value)
			if (selectedItem) {
				setQuery(selectedItem.value)
			}
		}
	}, [value, items])

	const defaultFilter = (item: SearchInputItem<T>, q: string) =>
		item.value.toLowerCase().includes(q.toLowerCase())

	const filteredItems = useMemo(() => {
		const filter = filterFn ?? defaultFilter
		const filtered = query ? items.filter((item) => filter(item, query)) : items

		return filtered.slice(0, maxSuggestions)
	}, [items, query, filterFn, maxSuggestions])

	useEffect(() => {
		setHighlightedIndex(0)
	}, [filteredItems])

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [])

	const handleSelect = (item: SearchInputItem<T>) => {
		setQuery(item.value)
		onChange?.(item.key)
		setIsOpen(false)
		inputRef.current?.blur()
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "ArrowDown" || e.key === "Enter") {
				setIsOpen(true)
			}
			return
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault()
				setHighlightedIndex((prev) =>
					prev < filteredItems.length - 1 ? prev + 1 : prev,
				)
				break
			case "ArrowUp":
				e.preventDefault()
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
				break
			case "Enter":
				e.preventDefault()
				if (filteredItems[highlightedIndex]) {
					handleSelect(filteredItems[highlightedIndex])
				}
				break
			case "Escape":
				setIsOpen(false)
				inputRef.current?.blur()
				break
		}
	}

	return (
		<div ref={containerRef} className="relative w-full">
			<input
				ref={inputRef}
				type="text"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value)
					onInputChange?.(e.target.value)
					if (!isOpen) setIsOpen(true)
				}}
				onFocus={() => setIsOpen(true)}
				onKeyDown={handleKeyDown}
				className={cn(
					"bg-input border border-border rounded-xl p-3 w-full outline-none",
					"focus:ring-2 focus:ring-ring/20 transition-shadow",
					className,
				)}
				autoComplete="off"
				{...inputProps}
			/>

			{isOpen && (
				<div
					className={cn(
						"absolute z-50 w-full mt-1",
						"bg-popover border border-border rounded-xl shadow-lg",
						"max-h-60 overflow-y-auto",
						"animate-in fade-in-0 zoom-in-95 duration-150",
					)}
				>
					{filteredItems.length > 0 ? (
						filteredItems.map((item, index) => (
							<Touchable key={String(item.key)}>
								<button
									type="button"
									onClick={() => handleSelect(item)}
									onMouseEnter={() => setHighlightedIndex(index)}
									className={cn(
										"w-full px-3 py-2.5 text-left transition-colors",
										"first:rounded-t-xl last:rounded-b-xl",
										highlightedIndex === index && "bg-secondary",
										value === item.key &&
											"text-accent-foreground font-medium",
									)}
								>
									{item.value}
								</button>
							</Touchable>
						))
					) : (
						<div className="px-3 py-2.5 text-muted-foreground text-center">
							{emptyMessage}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
