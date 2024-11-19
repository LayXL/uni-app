"use client"
import { useClientOnce } from "@/shared/hooks/use-client-once"
import {
  backButton,
  init,
  initData,
  miniApp,
  themeParams,
  viewport,
} from "@telegram-apps/sdk-react"
import type { ReactNode } from "react"

type TmaSdkProviderProps = {
  children: ReactNode
}

export const TmaSdkProvider = (props: TmaSdkProviderProps) => {
  useClientOnce(() => {
    init()

    if (backButton.isSupported()) {
      backButton.mount()
    }

    if (!miniApp.isMounted()) {
      miniApp.mount()
      miniApp.bindCssVars()
    }

    if (!themeParams.isMounted()) {
      themeParams.mount()
      themeParams.bindCssVars()
    }

    initData.restore()

    if (!viewport.isMounted() && !viewport.isMounting()) {
      void viewport.mount().catch((e) => {
        console.error("Something went wrong mounting the viewport", e)
      })
    }

    if (viewport.isMounted()) {
      viewport.bindCssVars()
    }
  })

  return props.children
}
