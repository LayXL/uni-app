export const MapLoading = () => (
	<div
		role="status"
		aria-busy="true"
		aria-label="Загрузка карты"
		className="grid size-full place-items-center bg-(--map-background)"
	>
		<div
			aria-hidden="true"
			className="size-8 animate-spin rounded-full border-2 border-muted/20 border-t-muted"
		/>
	</div>
)
