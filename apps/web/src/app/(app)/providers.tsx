import { BackButtonProvider } from "@/shared/providers/back-button-provider"
import { SaveLocationProvider } from "@/shared/providers/save-location-provider"
import { ThemeConfigProvider } from "@/shared/providers/theme-config-provider"
import { TmaSdkProvider } from "@/shared/providers/tma-sdk-provider"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"

type ProvidersProps = { children: ReactNode }

const Providers = async ({ children }: ProvidersProps) => (
  <NuqsAdapter>
    <ThemeProvider forcedTheme={"dark"}>
      <TmaSdkProvider>
        <BackButtonProvider>
          <ThemeConfigProvider>
            <SaveLocationProvider>{children}</SaveLocationProvider>
          </ThemeConfigProvider>
        </BackButtonProvider>
      </TmaSdkProvider>
    </ThemeProvider>
  </NuqsAdapter>
)

export default Providers
