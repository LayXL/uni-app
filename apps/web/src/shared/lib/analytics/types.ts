export type AnalyticsEventMap = {
	room_clicked: {
		room_id: number
		room_name: string
		floor_id: number
		source: "map" | "schedule"
	}
	room_searched: {
		room_id: number
		room_name: string
		floor_id: number
		source: "map_search" | "route_start" | "route_end"
	}
	group_selected: {
		group_id: number
		group_name: string
		source: "onboarding" | "schedule_search" | "schedule_recent"
	}
	group_saved_as_default: {
		group_id: number
		group_name: string
	}
	channel_banner_shown: {
		channel: "secretscode"
		group_name: string
	}
	channel_banner_clicked: {
		channel: "secretscode"
		group_name: string
	}
	channel_banner_dismissed: {
		channel: "secretscode"
		group_name: string
	}
	maintenance_channel_button_shown: {
		channel: "secretscode"
	}
	maintenance_channel_button_clicked: {
		channel: "secretscode"
	}
	onboarding_started: {
		step_count: number
	}
	onboarding_step_completed: {
		step: "features" | "group_selection"
		step_number: number
	}
	onboarding_completed: {
		group_id: number
		group_name: string
	}
	route_built: {
		start_entity_id: number | null
		end_entity_id: number | null
		nearest_toilet: boolean
	}
}

export type AnalyticsEventName = keyof AnalyticsEventMap

export type AnalyticsEvent = {
	[Name in AnalyticsEventName]: {
		name: Name
		params: AnalyticsEventMap[Name]
	}
}[AnalyticsEventName]

export type AnalyticsPageView = {
	url: string
	referer: string
}

export interface AnalyticsAdapter {
	track(event: AnalyticsEvent): void
	trackPageView(pageView: AnalyticsPageView): void
}
