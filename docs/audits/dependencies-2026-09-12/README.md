# Аудит зависимостей — 12 сентября 2026

Проверены 11 package.json (корень и 10 workspace), bun.lock (1145 записей пакетов), импорты исходников, Dockerfile и конфигурация сборки. Зависимости и lockfile не изменялись.

## Результат

`bun audit --json` через npm вернул 80 записей для 29 имён пакетов. После объединения по URL advisory: **66 уникальных advisory: 3 critical, 37 high, 22 moderate, 4 low**. Разные диапазоны версий и lodash/lodash-es могут ссылаться на один advisory. Это число известных уязвимостей в дереве, а не число доказанных способов атаковать приложение.

`bun outdated --recursive --no-cache` проверил версии всех workspace через реестр. Полный результат: [bun-outdated.txt](bun-outdated.txt). Машиночитаемые результаты безопасности: [bun-audit.json](bun-audit.json). Первичный sandbox-запрос audit не прошёл из-за сети; повторный запрос с сетевым разрешением завершился успешно (код 1 означает найденные уязвимости).

## Приоритетные изменения

| Приоритет | Пакет в lockfile | Действие | Применимость |
|---|---|---|---|
| P1 | @orpc/client 1.13.2 | Обновить согласованно @orpc/client, @orpc/server, @orpc/tanstack-query до 1.15.0; исправление client начинается с 1.13.6 | Critical prototype pollution. apps/web/src/server/rpc-handler.ts создаёт RPCHandler; десериализация RPC происходит до проверки схемы. Уязвимый путь используется приложением; конкретный обход прав/RCE не воспроизводился. |
| P1 | sharp 0.34.5 | Обновить обе декларации до 0.35.4 и пересобрать нативные зависимости | High в libvips/libheif. В packages/orpc/src/routes/events/upload-cover.ts и routes/homeworks/prepare-homework-file.ts обрабатываются изображения. Текущий ^0.34.5 не допускает 0.35.4. Эксплуатация зависит от формата и нативной сборки. |
| P2 | drizzle-orm 0.45.1 | Обновить до 0.45.2 | High: экранирование SQL-идентификаторов. В просмотренном коде имена таблиц статические, sql.identifier/sql.raw не найдены; передача пользовательских идентификаторов не подтверждена. |
| P2 | fabric 7.1.0 | Обновить до 7.4.0 | High/moderate XSS в SVG-сериализации. Карта использует Fabric; вызовов toSVG в исходниках не найдено, поэтому текущий путь эксплуатации не подтверждён. |
| P2 | js-cookie 3.0.5 | Обновить до 3.0.8 | High: внедрение атрибутов cookie через prototype hijack. Используется в Telegram-авторизации и test-time; контроль атакующим объекта атрибутов не подтверждён. |
| P2 | lodash-es 4.17.22 | Обновить до 4.18.1 | Найдены advisory для template/unset/omit. В парсере расписания используется flow; уязвимые вызовы не найдены. |
| P2 | @aws-sdk/client-s3 3.1004.0 | Обновить до 3.1131.0, повторно проверить дерево | Через @aws-sdk/xml-builder приходят fast-xml-parser 5.4.1 и fast-xml-builder 1.0.0. Обновление родителя требует повторного audit: само по себе не доказывает исправление всего дерева. |
| P2 | @turbo/gen 2.7.3, turbo 2.7.3 | Обновить инструменты и транзитивные пакеты; @turbo/gen перенести в devDependencies | Critical handlebars 4.7.8 приходит через node-plop; critical basic-ftp 5.1.0 — через proxy-agent → pac-proxy-agent → get-uri. Это пути генератора, их выполнение в обработчиках приложения не установлено. |

Источники: [oRPC](https://github.com/advisories/GHSA-m272-9rp6-32mc), [sharp/libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c), [Drizzle](https://github.com/advisories/GHSA-gpj5-g38j-94v9). Остальные ссылки приведены в полном перечне ниже.

## Конфигурация и лишние зависимости

1. **Несогласованные runtime-версии.** package.json задаёт bun@1.2.16, локально Bun 1.3.6, web/bot/schedule-updater Dockerfile — 1.3.6, proxy.Dockerfile — 1.3.3. Привести к одной проверенной версии. @types/bun и bun-types заданы неоднородно, местами latest; lockfile содержит несколько версий типов.
2. **Node engines занижен.** Корень разрешает >=20.9.0, установленный Vite 8.2.2 требует ^20.19.0 || >=22.12.0, @tanstack/react-start 1.168.49 — >=22.12.0. Указать совместимую версию Node и проверить её в контейнере: web start запускает именно node.
3. **Прокси не получает lockfile.** proxy.Dockerfile копирует только собственный package.json и два .ts-файла перед bun install --frozen-lockfile. Корневой bun.lock и workspace-манифест не копируются, поэтому зафиксированное дерево монорепозитория не используется. Исправить контекст установки либо отдельно фиксировать дерево прокси и проверить чистую Docker-сборку.
4. **Инструменты и типы в production dependencies.** apps/web: @turbo/gen и @types/fabric; apps/proxy: bun-types; packages/bitrix: @types/lodash-es присутствует одновременно в dependencies и devDependencies. У Fabric 7.1.0 уже есть собственный dist/index.d.ts; @types/fabric 5.x — кандидат на удаление с проверкой типов. Prettier в bitrix реально вызывается во время форматирования расписания, его переносить в devDependencies нельзя без изменения кода.
5. **Кандидаты на удаление.** В исходниках packages/orpc/src не обнаружены импорты @langchain/core, @langchain/google-genai, langchain, blurhash, ky, @vkontakte/vk-bridge. LangChain приводит langsmith 0.4.5 с high/moderate advisory и старые uuid. Перед удалением проверить динамические вызовы и сборку. Это статические кандидаты, не доказательство отсутствия использования во всех сценариях.
6. **Необъявленная зависимость workspace.** apps/web/src/shared/lib/vk-bridge.ts импортирует @vkontakte/vk-bridge, но apps/web/package.json его не объявляет: сейчас пакет доступен из корня. Объявить его непосредственно в web, чтобы workspace не зависел от hoisting.
7. **Production-образы содержат dev-дерево.** web/bot/schedule-updater устанавливают всю монорепу без production prune и остаются в том же образе. Даже сервер бота получает инструменты web. Разделить сборку и runtime; сохранить drizzle-kit там, где start действительно запускает миграции.

## Порядок исправлений и проверки

1. oRPC и sharp отдельным изменением: повторить audit, сборку web, проверки RPC-авторизации, сериализации и загрузки изображений. Для sharp уже есть prepare-homework-file.test.ts и sync-teacher-avatars.test.ts.
2. Обновить остальные уязвимые прямые зависимости, затем транзитивные через родителей/lockfile. Не накладывать общий override major-версий вслепую: у esbuild, minimatch, uuid и других несколько веток API.
3. Удалить подтверждённо неиспользуемые библиотеки, исправить категории зависимостей и Docker/runtime-конфигурацию. Проверить чистую установку с frozen-lockfile и сборки используемых образов.
4. Major-переходы (TypeScript 7, VK Bridge 3, ky 2, node-html-parser 9, lottie-react 3) проводить отдельно после проверки совместимости. Для устранения многих находок они не нужны.
5. Добавить регулярный audit полного дерева и контроль production-дерева в CI. Перенос пакета в devDependencies не исправляет его уязвимость и не удаляет его из текущих Docker-образов.

## Ограничения

Аудит статический, с актуальными данными npm. Эксплойты, сборки, тесты и Docker-сканирование ОС не запускались; лицензии транзитивного дерева отдельно не проверялись. Наличие уязвимого пакета в lockfile не доказывает его присутствие в клиентском bundle или достижимость извне. Исправления не применялись, поэтому уменьшение числа уязвимостей пока не проверено.

## Полный перечень advisory

Для каждого имени ниже перечислены все версии в lockfile, включая безопасные соседние копии; уязвимый диапазон указан отдельно для каждой записи.

### @opentelemetry/core — 2.11.0, 2.7.1

- **moderate** `<2.8.0` — [OpenTelemetry Core: Unbounded memory allocation in W3C Baggage propagation](https://github.com/advisories/GHSA-8988-4f7v-96qf)

### @orpc/client — 1.13.2

- **critical** `<=1.13.5` — [`@orpc/client` has Prototype Pollution via `StandardRPCJsonSerializer` Deserialization](https://github.com/advisories/GHSA-m272-9rp6-32mc)

### @turbo/workspaces — 2.7.3

- **low** `>=2.3.4 <2.9.14` — [Turbo: Unexpected local code execution during Yarn Berry detection](https://github.com/advisories/GHSA-3qcw-2rhx-2726)

### baseline-browser-mapping — 2.10.32

- **moderate** `>=2.0.0 <2.11.0` — [baseline-browser-mapping process termination on invalid input causes denial of service](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv)

### basic-ftp — 5.1.0

- **high** `<=5.3.0` — [basic-ftp allows a malicious FTP server to cause client-side denial of service via unbounded multiline control response buffering](https://github.com/advisories/GHSA-rpmf-866q-6p89)
- **critical** `<5.2.0` — [Basic FTP has Path Traversal Vulnerability in its downloadToDir() method](https://github.com/advisories/GHSA-5rq4-664w-9x2c)
- **high** `<=5.2.1` — [basic-ftp: Incomplete CRLF Injection Protection Allows Arbitrary FTP Command Execution via Credentials and MKD Commands](https://github.com/advisories/GHSA-6v7q-wjvx-w8wg)
- **high** `<=5.2.2` — [basic-ftp vulnerable to denial of service via unbounded memory consumption in Client.list()](https://github.com/advisories/GHSA-rp42-5vxx-qpwr)

### brace-expansion — 1.1.12, 2.0.2, 5.0.6

- **high** `<1.1.17` — [brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash](https://github.com/advisories/GHSA-mh99-v99m-4gvg)
- **high** `>=2.0.0 <2.1.3` — [brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash](https://github.com/advisories/GHSA-mh99-v99m-4gvg)
- **high** `>=4.0.0 <5.0.8` — [brace-expansion: DoS via unbounded expansion length causing an out-of-memory process crash](https://github.com/advisories/GHSA-mh99-v99m-4gvg)
- **high** `>=4.0.0 <5.0.9` — [brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation](https://github.com/advisories/GHSA-rgw5-rvv9-x895)
- **high** `>=2.0.0 <2.1.4` — [brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation](https://github.com/advisories/GHSA-rgw5-rvv9-x895)
- **high** `<1.1.18` — [brace-expansion: DoS via unbounded intermediate arrays, bypassing the CVE-2026-14257 mitigation](https://github.com/advisories/GHSA-rgw5-rvv9-x895)
- **moderate** `<1.1.13` — [brace-expansion: Zero-step sequence causes process hang and memory exhaustion](https://github.com/advisories/GHSA-f886-m6hf-6m8v)
- **moderate** `>=2.0.0 <2.0.3` — [brace-expansion: Zero-step sequence causes process hang and memory exhaustion](https://github.com/advisories/GHSA-f886-m6hf-6m8v)
- **high** `>=2.0.0 <2.1.2` — [brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp)
- **high** `<1.1.16` — [brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp)
- **high** `>=3.0.0 <5.0.7` — [brace-expansion: DoS via exponential-time expansion of consecutive non-expanding {} groups](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp)

### browserslist — 4.28.2

- **high** `<=4.28.6` — [Browserslist: Unbounded memory growth (no cache eviction) via distinct query results, leading to eventual OOM](https://github.com/advisories/GHSA-c83g-rgw3-j3cx)
- **high** `<=4.28.6` — [Browserslist: Uncaught crash / prototype write via untrusted browserslist-stats.json custom stats (normalizeStats)](https://github.com/advisories/GHSA-73wf-gq98-2v4g)

### diff — 4.0.2, 8.0.4

- **low** `>=4.0.0 <4.0.4` — [jsdiff has a Denial of Service vulnerability in parsePatch and applyPatch](https://github.com/advisories/GHSA-73rr-hh4g-fpgx)

### drizzle-orm — 0.45.1

- **high** `<0.45.2` — [Drizzle ORM has SQL injection via improperly escaped SQL identifiers](https://github.com/advisories/GHSA-gpj5-g38j-94v9)

### esbuild — 0.18.20, 0.25.12

- **moderate** `<=0.24.2` — [esbuild enables any website to send any requests to the development server and read the response](https://github.com/advisories/GHSA-67mh-4wv8-2f99)

### fabric — 7.1.0

- **high** `<7.2.0` — [Fabric.js Affected by Stored XSS via SVG Export](https://github.com/advisories/GHSA-hfvx-25r5-qc3w)
- **moderate** `<7.4.0` — [Fabric.js improper escaping in fabric.Gradient colorStops leads to XSS in SVG serialization](https://github.com/advisories/GHSA-w22m-hvvm-xmwx)

### fast-uri — 3.1.2

- **high** `>=3.0.0 <3.1.6` — [fast-uri vulnerable to server-side request forgery via malformed IPv6 normalization](https://github.com/advisories/GHSA-f65p-4m7j-42xc)
- **high** `>=3.1.2 <3.1.6` — [fast-uri vulnerable to server-side request forgery via repeated hostname percent-decoding](https://github.com/advisories/GHSA-fph4-wmhf-6fwf)
- **high** `>=3.0.0 <3.1.6` — [fast-uri vulnerable to host confusion via percent-encoded scheme normalization](https://github.com/advisories/GHSA-jqff-g426-hqxp)
- **high** `>=3.0.0 <3.1.5` — [fast-uri vulnerable to host confusion via backslash authority introducer](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7)
- **high** `>=3.0.0 <=3.1.3` — [fast-uri vulnerable to host confusion via literal backslash authority delimiter](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx)
- **high** `>=3.0.0 <3.1.3` — [fast-uri vulnerable to host confusion via failed IDN canonicalization](https://github.com/advisories/GHSA-4c8g-83qw-93j6)

### fast-xml-builder — 1.0.0

- **high** `<=1.1.6` — [fast-xml-builder allows attribute values with unwanted quotes to bypass malicious or unwanted attributes](https://github.com/advisories/GHSA-5wm8-gmm8-39j9)

### fast-xml-parser — 5.4.1

- **moderate** `<5.7.0` — [fast-xml-parser XMLBuilder: XML Comment and CDATA Injection via Unescaped Delimiters](https://github.com/advisories/GHSA-gh4j-gqv2-49f6)
- **high** `>=5.0.0 <5.5.6` — [fast-xml-parser affected by numeric entity expansion bypassing all entity expansion limits (incomplete fix for CVE-2026-26278)](https://github.com/advisories/GHSA-8gc5-j5rx-235r)
- **moderate** `>=5.0.0 <5.5.7` — [Entity Expansion Limits Bypassed When Set to Zero Due to JavaScript Falsy Evaluation in fast-xml-parser](https://github.com/advisories/GHSA-jp2q-39xq-3w4g)

### handlebars — 4.7.8

- **high** `>=4.0.0 <=4.7.8` — [Handlebars.js has JavaScript Injection via AST Type Confusion by tampering @partial-block](https://github.com/advisories/GHSA-3mfm-83xf-c92r)
- **critical** `>=4.0.0 <=4.7.8` — [Handlebars.js has JavaScript Injection via AST Type Confusion](https://github.com/advisories/GHSA-2w6w-674q-4c4q)
- **moderate** `>=4.0.0 <4.7.9` — [Handlebars.js has Prototype Pollution Leading to XSS through Partial Template Injection](https://github.com/advisories/GHSA-2qvq-rjwj-gvw9)
- **moderate** `>=4.6.0 <=4.7.8` — [Handlebars.js has a Prototype Method Access Control Gap via Missing __lookupSetter__ Blocklist Entry](https://github.com/advisories/GHSA-7rx3-28cr-v5wh)
- **low** `>=4.0.0 <=4.7.8` — [Handlebars.js has a Property Access Validation Bypass in container.lookup](https://github.com/advisories/GHSA-442j-39wm-28r2)
- **high** `>=4.0.0 <=4.7.8` — [Handlebars.js has JavaScript Injection via AST Type Confusion when passing an object as dynamic partial](https://github.com/advisories/GHSA-xhpv-hc6g-r9c6)
- **high** `>=4.0.0 <=4.7.8` — [Handlebars.js has Denial of Service via Malformed Decorator Syntax in Template Compilation](https://github.com/advisories/GHSA-9cx6-37pm-9jff)
- **high** `>=4.0.0 <=4.7.8` — [Handlebars.js has JavaScript Injection in CLI Precompiler via Unescaped Names and Options](https://github.com/advisories/GHSA-xjpj-3mr7-gcpf)

### ip-address — 10.1.0

- **moderate** `<=10.1.0` — [ip-address has XSS in Address6 HTML-emitting methods](https://github.com/advisories/GHSA-v2v4-37r5-5v8g)
- **high** `<=10.3.0` — [ip-address: Address4 decodes leading-zero octets as decimal while resolvers decode them as octal, allowing SSRF and trust-boundary bypass](https://github.com/advisories/GHSA-mwp4-54f8-5fhr)

### js-cookie — 3.0.5

- **high** `<=3.0.5` — [JavaScript Cookie: Per-instance prototype hijack in assign() enables cookie-attribute injection](https://github.com/advisories/GHSA-qjx8-664m-686j)

### js-yaml — 4.1.0, 4.3.2

- **moderate** `>=4.0.0 <4.1.1` — [js-yaml has prototype pollution in merge (<<)](https://github.com/advisories/GHSA-mh29-5h37-fv8m)
- **moderate** `>=4.0.0 <=4.1.1` — [JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases](https://github.com/advisories/GHSA-h67p-54hq-rp68)
- **high** `>=4.0.0 <4.3.0` — [js-yaml: YAML merge-key chains can force quadratic CPU consumption](https://github.com/advisories/GHSA-52cp-r559-cp3m)
- **high** `>=4.0.0 <4.3.1` — [JS-YAML: Quadratic CPU consumption in !!omap resolution (3.x and 4.x) — CVE-2026-59870 fix not backported](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)
- **high** `>=4.0.0 <4.3.2` — [js-yaml: maxTotalMergeKeys does not limit CPU use for empty merge sources](https://github.com/advisories/GHSA-2883-xcg3-v3hh)

### langsmith — 0.4.5

- **moderate** `>=0.3.41 <0.4.6` — [LangSmith Client SDK Affected by Server-Side Request Forgery via Tracing Header Injection](https://github.com/advisories/GHSA-v34v-rq6j-cj6p)
- **high** `<0.6.0` — [LangSmith SDK: Public prompt pull deserializes untrusted manifests without trust boundary warning](https://github.com/advisories/GHSA-3644-q5cj-c5c7)
- **moderate** `<=0.5.17` — [LangSmith Client SDKs has Prototype Pollution in langsmith-sdk via Incomplete `__proto__` Guard in Internal lodash `set()`](https://github.com/advisories/GHSA-fw9q-39r9-c252)
- **moderate** `<=0.5.18` — [LangSmith SDK: Streaming token events bypass output redaction](https://github.com/advisories/GHSA-rr7j-v2q5-chgv)

### lodash — 4.17.21

- **moderate** `>=4.0.0 <=4.17.22` — [Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg)
- **high** `>=4.0.0 <=4.17.23` — [lodash vulnerable to Code Injection via `_.template` imports key names](https://github.com/advisories/GHSA-r5fr-rjxr-66jc)
- **moderate** `<=4.17.23` — [lodash vulnerable to Prototype Pollution via array path bypass in `_.unset` and `_.omit`](https://github.com/advisories/GHSA-f23m-r3pf-42rh)

### lodash-es — 4.17.22

- **moderate** `>=4.0.0 <=4.17.22` — [Lodash has Prototype Pollution Vulnerability in `_.unset` and `_.omit` functions](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg)
- **high** `>=4.0.0 <=4.17.23` — [lodash vulnerable to Code Injection via `_.template` imports key names](https://github.com/advisories/GHSA-r5fr-rjxr-66jc)
- **moderate** `<=4.17.23` — [lodash vulnerable to Prototype Pollution via array path bypass in `_.unset` and `_.omit`](https://github.com/advisories/GHSA-f23m-r3pf-42rh)

### minimatch — 10.2.5, 3.1.2, 9.0.0

- **high** `<3.1.3` — [minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern](https://github.com/advisories/GHSA-3ppc-4f35-3m26)
- **high** `>=9.0.0 <9.0.6` — [minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern](https://github.com/advisories/GHSA-3ppc-4f35-3m26)
- **high** `<3.1.3` — [minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments](https://github.com/advisories/GHSA-7r86-cg39-jmmj)
- **high** `>=9.0.0 <9.0.7` — [minimatch has ReDoS: matchOne() combinatorial backtracking via multiple non-adjacent GLOBSTAR segments](https://github.com/advisories/GHSA-7r86-cg39-jmmj)
- **high** `<3.1.4` — [minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions](https://github.com/advisories/GHSA-23c5-xmqv-rm74)
- **high** `>=9.0.0 <9.0.7` — [minimatch ReDoS: nested *() extglobs generate catastrophically backtracking regular expressions](https://github.com/advisories/GHSA-23c5-xmqv-rm74)

### picomatch — 2.3.1, 4.0.4, 4.0.7

- **moderate** `<2.3.2` — [Picomatch: Method Injection in POSIX Character Classes causes incorrect Glob Matching](https://github.com/advisories/GHSA-3v7f-55p6-f55p)
- **high** `<2.3.2` — [Picomatch has a ReDoS vulnerability via extglob quantifiers](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj)

### sharp — 0.34.5

- **high** `<0.35.0` — [sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)
- **high** `<0.35.4` — [sharp: Vulnerabilities in libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)

### tmp — 0.0.33

- **low** `<=0.2.3` — [tmp allows arbitrary temporary file / directory write via symbolic link `dir` parameter](https://github.com/advisories/GHSA-52f5-9888-hmc6)
- **high** `<0.2.6` — [tmp has Path Traversal via unsanitized prefix/postfix that enables directory escape](https://github.com/advisories/GHSA-ph9p-34f9-6g65)

### turbo — 2.7.3

- **low** `>=1.1.0 <2.9.14` — [Turbo: Unexpected local code execution during Yarn Berry detection](https://github.com/advisories/GHSA-3qcw-2rhx-2726)
- **moderate** `<=2.9.13` — [Turbo: Login callback CSRF/session fixation](https://github.com/advisories/GHSA-hcf7-66rw-9f5r)

### uuid — 10.0.0, 11.1.0, 9.0.1

- **moderate** `<11.1.1` — [uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided](https://github.com/advisories/GHSA-w5hq-g745-h8pq)

### valibot — 1.2.0

- **moderate** `<=1.4.1` — [Valibot: record() issue paths can make flatten() throw for inherited Object property names](https://github.com/advisories/GHSA-5qjj-4xww-7phc)

### ws — 8.19.0, 8.21.3

- **moderate** `>=8.0.0 <8.20.1` — [ws: Uninitialized memory disclosure](https://github.com/advisories/GHSA-58qx-3vcg-4xpx)
- **high** `>=8.0.0 <8.21.0` — [ws: Memory exhaustion DoS from tiny fragments and data chunks](https://github.com/advisories/GHSA-96hv-2xvq-fx4p)

