import type { GlobalConfig } from "payload"

export const AppStatus: GlobalConfig = {
  slug: "app-status",
  label: "Статус приложения",
  admin: { hideAPIURL: true },
  fields: [
    {
      name: "notAvailable",
      type: "checkbox",
      label: "Сделать недоступным",
    },
    {
      name: "message",
      type: "text",
      label: "Сообщение",
    },
    {
      label: "Плашка при входе",
      type: "collapsible",
      fields: [
        {
          name: "showSnackbar",
          type: "checkbox",
          label: "Показывать плашку при входе в приложение",
        },
        {
          name: "snackbarType",
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
          name: "snackbarMessage",
          type: "text",
          label: "Сообщение",
        },
      ],
    },
  ],
}
