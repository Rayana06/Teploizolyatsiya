# Лабораторная работа №3  
## REST API каталога теплоизоляционных материалов

В лабораторной работе реализован REST API для работы с услугами — теплоизоляционными материалами.

## REST-методы

| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/insulation-materials` | Получение списка опубликованных услуг с фильтрацией |
| GET | `/api/insulation-materials/feed` | Получение первого элемента ленты |
| GET | `/api/insulation-materials/feed/:id?next=true` | Получение следующего элемента ленты |
| GET | `/api/insulation-materials/draft` | Получение черновика текущего пользователя |
| POST | `/api/insulation-materials` | Создание услуги с изображением и видео |
| PUT | `/api/insulation-materials/:id/publish` | Публикация услуги |
| DELETE | `/api/insulation-materials/:id` | Логическое удаление услуги |
| POST | `/api/insulation-materials/:id/like` | Установка или отмена лайка |
| POST | `/api/users/register` | Регистрация пользователя |
| POST | `/api/users/authenticate` | Заглушка аутентификации для лабораторной работы №4 |
| POST | `/api/users/logout` | Заглушка деавторизации для лабораторной работы №4 |

## Параметры фильтрации списка

Метод `GET /api/insulation-materials` поддерживает параметры:

- `maxThicknessMm` — максимальная толщина материала;
- `insulationType` — тип утеплителя;
- `search` — поиск по названию услуги.

В ответе поле `isCreator` принимает значение:

- `1` — услуга создана текущим пользователем;
- `0` — услуга создана другим пользователем.

## Лента услуг

Запрос без идентификатора:

```http
GET /api/insulation-materials/feed
