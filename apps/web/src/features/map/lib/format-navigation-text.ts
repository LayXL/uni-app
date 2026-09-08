import { NBSP } from "@repo/shared/nbsp"

export const formatNavigationText = (text: string) =>
	text
		.replace(
			/(?<!\S)(в|во|на|к|ко|с|со|у|о|об|от|до|по|из|за|для|под|над|при|без|через|и|а|но) +/gi,
			`$1${NBSP}`,
		)
		.replace(/(\d+(?:[.,]\d+)?) +(этаж)/gi, `$1${NBSP}$2`)
