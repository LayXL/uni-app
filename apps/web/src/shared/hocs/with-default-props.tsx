import type {ComponentProps} from "react"

export default function withDefaultProps<P>(
  Component: P,
  // @ts-ignore
  defaultProps: Partial<ComponentProps<P>>
) {
  // @ts-ignore
  return (props: Partial<ComponentProps<P>>) => (
    // @ts-ignore
    <Component {...defaultProps} {...props} />
  )
}
