import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { nestProviders } from "react-nest-providers"

export default nestProviders()
  .push(NuqsAdapter)
  .push(ThemeProvider)
  .build()
