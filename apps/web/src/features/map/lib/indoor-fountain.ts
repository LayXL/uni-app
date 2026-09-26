import {
	BoxGeometry,
	Color,
	CylinderGeometry,
	Float32BufferAttribute,
	Group,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
} from "three"

/** A compact square basin; dimensions use the same map units as the walls. */
export const createIndoorFountain = (
	theme: "light" | "dark",
	entityId: number,
) => {
	const group = new Group()
	group.name = "indoor-fountain"
	group.scale.setScalar(0.8)
	const colors =
		theme === "dark"
			? {
					stone: "#7395ae",
					top: "#b7d3e5",
					side: "#47667f",
					water: "#219fc6",
					waterEdge: "#105a79",
				}
			: {
					stone: "#bdd0de",
					top: "#f0f7fc",
					side: "#92aec2",
					water: "#42c4e4",
					waterEdge: "#147a9a",
				}
	const stone = new MeshBasicMaterial({ vertexColors: true, toneMapped: false })
	const water = new MeshBasicMaterial({
		vertexColors: true,
		toneMapped: false,
	})
	const spray = new MeshBasicMaterial({ color: "#c4f3ff", toneMapped: false })
	const pickTargets: Mesh[] = []
	const add = (mesh: Mesh, x: number, y: number, z: number) => {
		mesh.position.set(x, y, z)
		mesh.userData.entityId = entityId
		group.add(mesh)
		pickTargets.push(mesh)
	}
	const block = (
		w: number,
		h: number,
		d: number,
		x: number,
		y: number,
		z: number,
	) => {
		const geometry = new BoxGeometry(w, h, d)
		const normals = geometry.getAttribute("normal")
		const shades = new Float32BufferAttribute(normals.count * 3, 3)
		const color = new Color()
		for (let i = 0; i < normals.count; i++) {
			color.set(
				normals.getY(i) > 0.5
					? colors.top
					: normals.getX(i) > 0.5
						? colors.side
						: colors.stone,
			)
			shades.setXYZ(i, color.r, color.g, color.b)
		}
		geometry.setAttribute("color", shades)
		add(new Mesh(geometry, stone), x, y, z)
	}
	// The basin sits just above the floor without a projecting plinth.
	block(128, 4, 128, 0, 2.5, 0)
	block(128, 18, 12, 0, 13.5, -58)
	block(128, 18, 12, 0, 13.5, 58)
	block(12, 18, 104, -58, 13.5, 0)
	block(12, 18, 104, 58, 13.5, 0)
	const surface = new PlaneGeometry(104, 104, 24, 24)
	surface.rotateX(-Math.PI / 2)
	const positions = surface.getAttribute("position")
	const shades = new Float32BufferAttribute(positions.count * 3, 3)
	const edge = new Color(colors.waterEdge)
	const center = new Color(colors.water)
	const shade = new Color()
	for (let i = 0; i < positions.count; i++) {
		// Blend each bank independently for a soft inset, including the corners.
		const across = MathUtils.smoothstep(52 - Math.abs(positions.getX(i)), 0, 18)
		const along = MathUtils.smoothstep(52 - Math.abs(positions.getZ(i)), 0, 18)
		shade.lerpColors(edge, center, across * along)
		shades.setXYZ(i, shade.r, shade.g, shade.b)
	}
	surface.setAttribute("color", shades)
	add(new Mesh(surface, water), 0, 13, 0)
	block(9, 6, 9, 0, 16, 0)
	add(new Mesh(new CylinderGeometry(1.5, 3, 26, 8), spray), 0, 32, 0)
	return { group, pickTargets, stone }
}
