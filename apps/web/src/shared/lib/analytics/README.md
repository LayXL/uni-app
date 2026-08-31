# Аналитика

Компоненты интерфейса отправляют типизированные доменные события через
`analytics.track()` и не зависят от конкретного сервиса аналитики.

Чтобы подключить или заменить сервис:

1. Реализуйте интерфейс `AnalyticsAdapter` из `types.ts`.
2. Добавьте адаптер в массив `adapters` в `index.ts`.
3. Подключите клиентский загрузчик SDK рядом с `YandexMetrika` в корневом layout.

## События

Источник истины для имен и параметров событий — `types.ts`.

| Событие                     | Назначение                                               | Параметры                                                                                  |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `room_clicked`              | Клик по кабинету на карте или в расписании               | `room_id`, `room_name`, `floor_id`, `source` (`map` или `schedule`)                        |
| `room_searched`             | Выбор кабинета через поиск карты или построение маршрута | `room_id`, `room_name`, `floor_id`, `source` (`map_search`, `route_start` или `route_end`) |
| `group_selected`            | Выбор группы в онбординге или расписании                 | `group_id`, `group_name`, `source` (`onboarding`, `schedule_search` или `schedule_recent`) |
| `group_saved_as_default`    | Сохранение просматриваемой группы как своей              | `group_id`, `group_name`                                                                   |
| `channel_banner_shown`      | Показ баннера Telegram-канала в расписании               | `channel`, `group_name`                                                                    |
| `channel_banner_clicked`    | Переход в Telegram-канал по баннеру                      | `channel`, `group_name`                                                                    |
| `channel_banner_dismissed`  | Постоянное скрытие баннера крестиком                     | `channel`, `group_name`                                                                    |
| `maintenance_channel_button_shown`   | Показ кнопки Telegram-канала на экране технических работ | `channel`                                                                    |
| `maintenance_channel_button_clicked` | Клик по кнопке Telegram-канала на экране технических работ | `channel`                                                                  |
| `onboarding_started`        | Открытие онбординга                                      | `step_count`                                                                               |
| `onboarding_step_completed` | Завершение шага онбординга                               | `step`, `step_number`                                                                      |
| `onboarding_completed`      | Успешное сохранение группы и завершение онбординга       | `group_id`, `group_name`                                                                   |
| `route_built`               | Построение маршрута по карте                             | `start_entity_id`, `end_entity_id`, `nearest_toilet`                                       |

Переходы между страницами отправляются отдельно через `analytics.trackPageView()`
с абсолютным `url` и предыдущим `referer`. Первый просмотр регистрирует сама
Яндекс Метрика при инициализации; явный `hit` отправляется только для последующих
клиентских переходов.

Для Яндекс Метрики события передаются через `reachGoal`. Чтобы они появились в
отчёте «Параметры событий», создайте для нужных событий отдельные цели типа
«JavaScript-событие» с идентификаторами из таблицы. Текущий номер счетчика задан
константой `YANDEX_METRIKA_COUNTER_ID` в `adapters/yandex-metrika.ts`.
