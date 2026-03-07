import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { nestProviders } from "react-nest-providers"

import { PopupProvider } from "@/shared/ui/popup"

import { QueryClientProvider } from "./query-client-provider"
import { TelegramUiProvider } from "./telegram-ui-provider"
import { TmaProvider } from "./tma-provider"
import { VkmaProvider } from "./vkma-provider"

export default nestProviders()
	.push(NuqsAdapter)
	.push(ThemeProvider, { attribute: "class" })
	.push(QueryClientProvider)
	.push(TmaProvider)
	.push(VkmaProvider)
	.push(PopupProvider)
	.push(TelegramUiProvider)
	.build()
