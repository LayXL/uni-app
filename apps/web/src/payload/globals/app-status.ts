import type { GlobalConfig } from "payload"

export const AppStatus: GlobalConfig = {
  slug: "app-status",
  label: "Статус приложения",
  fields: [
    {
      name: "notAvailable",
      type: "checkbox",
      label: "Сделать недоступным",
    },
    {
      label: "Плашка при входе",
      type: "collapsible",
      fields: [
        {
          name: "show",
          type: "checkbox",
          label: "Показывать плашку при входе в приложение",
        },
        {
          name: "type",
          type: "select",
          label: "Тип",
          options: [
            {
              label: "Информация",
              value: "info",
            },
            {
              label: "Предупреждение",
              value: "warning",
            },
            {
              label: "Ошибка",
              value: "error",
            },
          ],
        },
        {
          name: "message",
          type: "text",
          label: "Сообщение",
        },
      ],
    },
  ],
}
