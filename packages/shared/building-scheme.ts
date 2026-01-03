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

export type MapEntity = {
	name: string
	/** приоритет для поиска/отображения */
	priority?: number
	/** алиасы для поиска */
	aliases?: string[]
	/** скрывать из поиска */
	hiddenInSearch?: boolean
	/** описание сущности */
	description?: string
	/** опциональный icon на плане */
	icon?: IconType
	/** глобальная позиция “якоря” */
	position: Coordinate
	/** id сущности (не у всех есть в json) */
	id?: number
}

export type Room = MapEntity & {
	/** скрытое имя/служебные */
	nameHidden?: boolean
	/** можно ли кликать по комнате */
	clickable?: boolean
	/** полигон стен в локальных координатах комнаты */
	wallsPosition: WallsPolygon
	/** локальные координаты дверей (относительно position) */
	doorsPosition?: DoorPosition[]
	/** индекс этажа, если присутствует */
	floorIndex?: number
	/** опциональная ссылка (например, vk) */
	url?: string
}

export type Stair = {
	id: number
	/** список id этажей, которые соединяет лестница */
	floors: number[]
	position: Coordinate
}

export type Place = MapEntity & {
	type?: PlaceType
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

/** корневой объект файла список этажей */
export type BuildingScheme = Floor[]
