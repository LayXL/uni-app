import { payload } from "@/shared/utils/payload"

export const UnavailableFallback = async () => {
  const appStatus = await payload.findGlobal({ slug: "app-status" })

  if (appStatus.notAvailable) {
    const currentUrl = request.nextUrl.pathname + request.nextUrl.search

    const redirectUrl = new URL("/unavailable", request.url)
    redirectUrl.searchParams.set("from", currentUrl)

    return NextResponse.redirect(redirectUrl)
  }
}
