# Диаграмма взаимосвязей сущностей

Диаграмма построена по актуальной Drizzle-схеме из
`packages/drizzle/schema.ts`.

```mermaid
erDiagram
    GROUPS o|--o{ USERS : "выбрана пользователем (FK)"
    SUBJECTS o|--o{ CLASSES : "определяет занятие (FK)"
    USERS o|--o{ HOMEWORKS : "создает (FK)"
    GROUPS o|--o{ HOMEWORKS : "получает общее задание (FK)"
    SUBJECTS o|--o{ HOMEWORKS : "определяет предмет (FK)"
    USERS ||--o{ HOMEWORK_COMPLETIONS : "отмечает выполнение (FK)"
    HOMEWORKS ||--o{ HOMEWORK_COMPLETIONS : "имеет отметки выполнения (FK)"
    USERS o|--o{ EVENTS : "создает (FK)"
    GROUPS }o--o{ CLASSES : "участвует, логически через classes.groups[]"
    GROUPS }o--o{ EVENTS : "получает, логически через events.groupsRegex"

    CONFIG {
        text id PK
        json json
    }

    USERS {
        serial id PK
        bigint telegramId UK
        integer vkId UK
        integer group FK
        boolean isAdmin
        boolean isEnabledNotifications
        varchar firstName
        varchar lastName
    }

    GROUPS {
        serial id PK
        varchar bitrixId
        varchar displayName
        group_type type
        boolean isDeleted
    }

    SUBJECTS {
        serial id PK
        varchar name
    }

    CLASSES {
        date date PK
        integer order PK
        integer subject PK,FK
        varchar classroom PK
        boolean isCancelled
        boolean isDistance
        boolean isChanged
        json original
        integer_array groups
    }

    HOMEWORKS {
        text id PK
        date date
        integer subject FK
        timestamp createdAt
        timestamp deadline
        integer author FK
        integer group FK
        varchar title
        text description
        json files
        boolean isSharedWithWholeGroup
    }

    HOMEWORK_COMPLETIONS {
        integer userId PK,FK
        text homeworkId PK,FK
        timestamp completedAt
    }

    EVENTS {
        serial id PK
        timestamp createdAt
        integer author FK
        varchar title
        text description
        text coverImage
        varchar backgroundColor
        varchar borderColor
        varchar textColor
        varchar buttonColor
        text groupsRegex
        timestamp date
        text buttonUrl
        varchar buttonText
    }
```

## Обозначения и особенности

- `PK` — первичный ключ, `FK` — внешний ключ, `UK` — уникальное поле.
- `group_type` принимает значения `teacher` и `studentsGroup`.
- `HOMEWORK_COMPLETIONS` реализует связь многие-ко-многим между
  пользователями и домашними заданиями.
- Связь `GROUPS` ↔ `CLASSES` логическая: ID групп хранятся в массиве
  `classes.groups`, поэтому PostgreSQL не контролирует ее внешним ключом.
- Связь `GROUPS` ↔ `EVENTS` логическая: событие выбирает группы через
  сопоставление `events.groupsRegex` с `groups.displayName`.
- `CONFIG` — самостоятельное key-value хранилище конфигурации без связей с
  другими таблицами.
