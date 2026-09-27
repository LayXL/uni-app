export const MAP_ICON_SIZE = 20
export const MAP_ICON_RADIUS = 14
export const MAP_ICON_LABEL_TOP = MAP_ICON_RADIUS + 5

const iconColors: Record<string, string> = {
	food: "#d24700",
	wardrobe: "#c95000",
	"storefront-outline-24": "#c95000",
	"money-outline-20": "#008755",
	"users-outline-24": "#3159ed",
	"education-outline-24": "#8035ee",
	"book-spread-outline-24": "#a34b16",
	stairs: "#526b91",
	toilet: "#8035ee",
	"toilet-women": "#d52378",
	"toilet-men": "#2467ed",
	entry: "#008755",
	ecobox: "#29851c",
	waterSource: "#007bc4",
	"water-source": "#007bc4",
	fountain: "#008096",
	terminal: "#3159ed",
	typography: "#d52378",
	projectAnalyticCenter: "#d73f2a",
	"project-analytic-center": "#d73f2a",
}

export const getMapIconColor = (icon: string): string =>
	iconColors[icon] ?? "#526b91"
