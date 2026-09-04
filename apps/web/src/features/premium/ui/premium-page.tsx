import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import type { IconName } from "@/types/icon-name"

import { usePremiumTelegramSwipes } from "../lib/use-premium-telegram-swipes"
import { PremiumStar } from "./premium-star"
import "./premium.css"

const features = [
	{
		title: "Ускорить время",
		description:
			"Пара идёт на скорости ×2, а перемена автоматически замедляется",
		icon: "clock-outline-28",
		label: "×2",
	},
	{
		title: "МЭПП ЭЙ АЙ",
		description:
			"Поможет сделать дз за тебя\nИ объяснит, что ты только что сдал",
		icon: "iconify:material-symbols:auto-awesome",
	},
	{
		title: "Отмена первой пары",
		description:
			"Отправляет преподавателю очень убедительное «а может, не надо?»",
		icon: "iconify:material-symbols:event-busy-outline",
	},
	{
		title: "Дедлайн Pro",
		description: "Переносит сдачу на завтра — завтра функция снова доступна",
		icon: "iconify:material-symbols:calendar-today-outline",
	},
] satisfies {
	title: string
	description: string
	icon: IconName
	label?: string
}[]

export function PremiumPage({ onDismiss }: { onDismiss: () => void }) {
	usePremiumTelegramSwipes()

	return (
		<main className="premium-page">
			<section className="premium-hero" aria-labelledby="premium-title">
				<PremiumStar />
				<h1 id="premium-title">
					МЭПП<span>+</span>
				</h1>
				<p className="premium-tagline">Учёба с суперспособностями</p>
			</section>
			<section className="premium-features" aria-label="Возможности МЭПП+">
				<ul>
					{features.map((feature) => (
						<li key={feature.title} className="premium-feature">
							<div className="premium-feature-icon" aria-hidden="true">
								{feature.label ? (
									<span>{feature.label}</span>
								) : (
									<Icon name={feature.icon} size={25} />
								)}
							</div>
							<div>
								<h3>{feature.title}</h3>
								<p>{feature.description}</p>
							</div>
						</li>
					))}
				</ul>
			</section>
			<div className="premium-subscribe-bar">
				<Button
					variant="accent"
					className="premium-subscribe-button"
					label={"Оформить за 499\u2009₽ / месяц"}
				/>
				<button
					type="button"
					className="premium-dismiss-button"
					onClick={onDismiss}
				>
					Нет, спасибо
				</button>
			</div>
		</main>
	)
}
