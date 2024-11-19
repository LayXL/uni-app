import { BackButtonProvider } from "@/shared/providers/back-button-provider"
import { ThemeConfigProvider } from "@/shared/providers/theme-config-provider"
import { TmaSdkProvider } from "@/shared/providers/tma-sdk-provider"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

type ProvidersProps = {
  children: ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ThemeProvider>
      <TmaSdkProvider>
        <BackButtonProvider>
          <ThemeConfigProvider>{children}</ThemeConfigProvider>
        </BackButtonProvider>
      </TmaSdkProvider>
    </ThemeProvider>
  )
}
