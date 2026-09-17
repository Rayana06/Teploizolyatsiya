# ER-диаграмма для StarUML

В StarUML создайте ER Diagram и три сущности. Каскадное удаление не используется: у всех внешних ключей `ON DELETE RESTRICT`.

## `users`

| Столбец | PostgreSQL | Ключ |
|---|---|---|
| `user_id` | `integer` | PK, identity |
| `email` | `varchar(254)` | UQ, NOT NULL |
| `display_name` | `varchar(100)` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL |

## `insulation_materials`

| Столбец | PostgreSQL | Ключ / ограничение |
|---|---|---|
| `insulation_material_id` | `integer` | PK, identity |
| `name` | `varchar(120)` | NOT NULL |
| `short_description` | `varchar(300)` | NULL |
| `status` | `enum(draft,published,deleted)` | NOT NULL |
| `image_url` | `varchar(500)` | NULL |
| `video_url` | `varchar(500)` | NULL |
| `insulation_type` | `varchar(50)` | предметное поле 1 |
| `thickness_mm` | `smallint` | предметное поле 2, > 0 |
| `manufacturer` | `varchar(100)` | NULL |
| `application_area` | `varchar(120)` | NULL |
| `sku` | `varchar(40)` | NULL |
| `price_rub_m2` | `numeric(10,2)` | >= 0 |
| `source_url` | `varchar(500)` | NULL |
| `created_at` | `timestamptz` | NOT NULL |
| `published_at` | `timestamptz` | NULL |
| `creator_id` | `integer` | FK → `users.user_id`, RESTRICT |

Частичный уникальный индекс: `UNIQUE (creator_id) WHERE status = 'draft'`.

## `insulation_material_likes`

| Столбец | PostgreSQL | Ключ |
|---|---|---|
| `insulation_material_like_id` | `integer` | PK, identity |
| `user_id` | `integer` | FK → `users.user_id`, RESTRICT |
| `insulation_material_id` | `integer` | FK → `insulation_materials.insulation_material_id`, RESTRICT |
| `created_at` | `timestamptz` | NOT NULL |

Ограничение `UNIQUE (user_id, insulation_material_id)` запрещает повторный лайк. Связи: `users 1—M insulation_materials`; `users M—M insulation_materials` через `insulation_material_likes`.
