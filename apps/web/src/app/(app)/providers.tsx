import { BackButtonProvider } from "@/shared/providers/back-button-provider"
import { QueryClientProvider } from "@/shared/providers/query-client-provider"
import { SaveLocationProvider } from "@/shared/providers/save-location-provider"
import { ThemeConfigProvider } from "@/shared/providers/theme-config-provider"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { nestProviders } from "react-nest-providers"

const Providers = nestProviders()
  .push(NuqsAdapter)
  .push(QueryClientProvider)
  .push(ThemeProvider, { forcedTheme: "dark" })
  .push(BackButtonProvider)
  .push(ThemeConfigProvider)
  .push(SaveLocationProvider)
  .build()

export default Providers
