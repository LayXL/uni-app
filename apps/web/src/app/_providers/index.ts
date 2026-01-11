import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { nestProviders } from "react-nest-providers"

import { PopupProvider } from "@/shared/ui/popup"

import { BackButtonProvider } from "./back-button-provider"
import { QueryClientProvider } from "./query-client-provider"
import { ThemeProviderComponent } from "./theme-provider"
import { TmaProvider } from "./tma-provider"
import { ViewportProvider } from "./viewport-provider"

export default nestProviders()
	.push(NuqsAdapter)
	.push(ThemeProvider, { attribute: "class" })
	.push(QueryClientProvider)
	.push(TmaProvider)
	.push(ThemeProviderComponent)
	.push(PopupProvider)
	.push(BackButtonProvider)
	.push(ViewportProvider)
	.build()
