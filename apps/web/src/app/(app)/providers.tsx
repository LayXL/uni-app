import { BackButtonProvider } from "@/shared/providers/back-button-provider"
import { ThemeConfigProvider } from "@/shared/providers/theme-config-provider"
import { TmaSdkProvider } from "@/shared/providers/tma-sdk-provider"
import { ThemeProvider } from "next-themes"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import type { ReactNode } from "react"

type ProvidersProps = {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <NuqsAdapter>
      <ThemeProvider forcedTheme={"dark"}>
        <TmaSdkProvider>
          <BackButtonProvider>
            <ThemeConfigProvider>{children}</ThemeConfigProvider>
          </BackButtonProvider>
        </TmaSdkProvider>
      </ThemeProvider>
    </NuqsAdapter>
  )
}
