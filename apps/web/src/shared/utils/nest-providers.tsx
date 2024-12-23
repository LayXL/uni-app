// type Provider<T extends FC<any>> = [T, ComponentProps<T>?]

// export const nestProviders =
//   <P extends Array<Provider<any>>>(...providers: P) =>
//   ({ children }: { children: ReactNode }) =>
//     providers.reduceRight(
//       (nested, [Provider, props], i) => (
//         <Provider key={i} {...(props || {})}>
//           {nested}
//         </Provider>
//       ),
//       children
//     )

// export const nestProviders = (...providers: ReactElement[]) => {
//   return ({ children }: { children: ReactNode }) =>
//     providers.reduceRight(
//       (nested, provider, i) =>
//         cloneElement(provider, { key: i, children: nested }),
//       children
//     )
// }

import { type ComponentProps, type FC, type ReactNode, useMemo } from "react"

type Provider<T extends FC<any>> = [T, ComponentProps<T>?]

export const nestProviders = () => {
  const providers: Array<Provider<FC<any>>> = []

  return {
    push<T extends FC<any>>(Provider: T, props?: ComponentProps<T>) {
      providers.push([Provider, props])
      return this
    },
    build(): FC<{ children: ReactNode }> {
      return ({ children }) => {
        const MemoizedProviders = useMemo(
          () =>
            providers.reduceRight(
              (nested, [Provider, props], i) => (
                <Provider key={i} {...(props || {})}>
                  {nested}
                </Provider>
              ),
              children
            ),
          [children]
        )
        return <>{MemoizedProviders}</>
      }
    },
  }
}
