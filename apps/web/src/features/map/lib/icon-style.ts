export const MAP_ICON_SIZE = 20
export const MAP_ICON_RADIUS = 14
export const MAP_ICON_LABEL_TOP = MAP_ICON_RADIUS + 5

const iconColors: Record<string, string> = {
	wardrobe: "#b45309",
	stairs: "#475569",
	toilet: "#7c3aed",
	"toilet-women": "#be185d",
	"toilet-men": "#2563eb",
	entry: "#047857",
	ecobox: "#4d7c0f",
	waterSource: "#0284c7",
	"water-source": "#0284c7",
	fountain: "#0e7490",
	terminal: "#1d4ed8",
	typography: "#be185d",
	projectAnalyticCenter: "#c2410c",
	"project-analytic-center": "#c2410c",
}

export const getMapIconColor = (icon: string): string =>
	iconColors[icon] ?? "#475569"
