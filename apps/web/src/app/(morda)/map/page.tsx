import { Suspense } from "react"

import { MapPageContent, MapPageSkeleton } from "./_ui/map-page-content"

export default function MapPage() {
	return (
		<Suspense fallback={<MapPageSkeleton />}>
			<MapPageContent />
		</Suspense>
	)
}
