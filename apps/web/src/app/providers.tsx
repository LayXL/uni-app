import { TrpcQueryClientProvider } from "@/features/common/providers/trpc-query-client-provider"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { nestProviders } from "react-nest-providers"

export default nestProviders()
  .push(NuqsAdapter)
  .push(TrpcQueryClientProvider)
  .push(ThemeProvider)
  .build()
