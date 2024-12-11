import { removeScriptElements } from "bitrix/schedule/parser/remove-script-elements"
import getSession from "bitrix/session/get-session"
import { parse } from "node-html-parser"

export default async function Page() {
  const session = await getSession("", "")

  const news = await fetch(
    "https://portal.midis.info/mobile/?RELOAD_JSON=Y&AJAX_CALL=Y&PAGEN_1=1",
    {
      headers: {
        Cookie: session.cookie,
      },
    }
  )
    .then((res) => res.text())
    .then((res) =>
      removeScriptElements(
        res
          .replace(/.+CONTENT':'(.+)'/, "$1")
          .replaceAll("\\n", "\n")
          .replaceAll('\\"', '"')
          .replaceAll("\\/", "/")
      )
    )

  const parsed = parse(news)

  return (
    <div className="flex flex-col gap-3">
      {parsed.querySelectorAll(".lenta-item").map((item) => {
        return (
          <div key={item.id} className="bg-neutral-3 p-3">
            <p>{item.querySelector(".post-item-top-title")?.innerText}</p>
            <p
              dangerouslySetInnerHTML={{
                __html: item.querySelector(".post-item-contentview")?.innerHTML,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
