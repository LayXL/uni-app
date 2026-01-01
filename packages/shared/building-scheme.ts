export type Coordinate = {
	x: number
	y: number
}

export type Road = {
	start: Coordinate
	end: Coordinate
}

export type DoorPosition = Coordinate

export type WallsPolygon = Coordinate[]

export type PlaceType =
	| "entry"
	| "ecobox"
	| "waterSource"
	| "terminal"
	| "fountain"
	| "typography"
	| string

export type IconType =
	| "entry"
	| "ecobox"
	| "waterSource"
	| "terminal"
	| "fountain"
	| "typography"
	| "projectAnalyticCenter"
	| string

export type Room = {
	name: string
	description?: string
	/** скрытое имя/служебные */
	nameHidden?: boolean
	/** приоритет для поиска/отображения */
	priority?: number
	/** можно ли кликать по комнате */
	clickable?: boolean
	/** скрывать из поиска */
	hiddenInSearch?: boolean
	/** алиасы для поиска */
	aliases?: string[]
	/** глобальная позиция “якоря” комнаты */
	position: Coordinate
	/** полигон стен в локальных координатах комнаты */
	wallsPosition: WallsPolygon
	/** локальные координаты дверей (относительно position) */
	doorsPosition?: DoorPosition[]
	/** id комнаты (не у всех есть в json) */
	id?: number
	/** индекс этажа, если присутствует */
	floorIndex?: number
	/** опциональная ссылка (например, vk) */
	url?: string
	/** опциональный icon на плане */
	icon?: IconType
}

export type Stair = {
	id: number
	/** список id этажей, которые соединяет лестница */
	floors: number[]
	position: Coordinate
}

export type Place = {
	name: string
	/** приоритет точки интереса */
	priority?: number
	/** алиасы в поиске */
	aliases?: string[]
	type?: PlaceType
	description?: string
	icon?: IconType
	position: Coordinate
}

export type PhotoPoint = {
	position: Coordinate
	/** угол обзора в градусах */
	angle: number
	/** имя файла/урл изображения */
	url: string
}

export type Floor = {
	name: string
	/** числовой id этажа (0,1,2,7 и т.п.) */
	id: number
	/** сдвиг всего этажа на глобальном плане */
	position: Coordinate
	/** краткое обозначение (“1”, “4” и т.п.) */
	acronym?: string
	/** внешний полигон стен этажа */
	wallsPosition: WallsPolygon
	/** коридоры/маршруты */
	roads?: Road[]
	/** комнаты на этаже */
	rooms?: Room[]
	/** лестницы на этаже */
	stairs?: Stair[]
	/** точки интереса */
	places?: Place[]
	/** фотовьюшки на этаже */
	photoPoints?: PhotoPoint[]
}

/** корневой объект файла paste.txt — список этажей */
export type BuildingScheme = Floor[]
