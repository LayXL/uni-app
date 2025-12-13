import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { nestProviders } from "react-nest-providers"

import { QueryClientProvider } from "./query-client-provider"
import { TmaProvider } from "./tma-provider"

export default nestProviders()
	.push(NuqsAdapter)
	.push(ThemeProvider, { attribute: "class" })
	.push(QueryClientProvider)
	.push(TmaProvider)
	.build()
