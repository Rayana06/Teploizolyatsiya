-- Выполнить один раз в Adminer: SQL-команда -> вставить весь файл -> Выполнить.
-- Схема создаётся миграцией TypeORM при первом запуске приложения.

INSERT INTO users (user_id, email, display_name)
SELECT number, 'user' || number || '@teploshchit.local', CASE WHEN number = 1 THEN 'Анна Смирнова' ELSE 'Пользователь ' || number END
FROM generate_series(1, 25) AS number;

SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT max(user_id) FROM users));

INSERT INTO insulation_materials
  (insulation_material_id, name, short_description, status, image_url, video_url, insulation_type, thickness_mm, manufacturer, application_area, sku, price_rub_m2, source_url, creator_id, published_at)
VALUES
  (1, 'Технолайт Оптима', 'Каменная вата для утепления каркасных стен и ненагружаемых перекрытий.', 'published', 'http://localhost:9010/insulation-materials/technolight-optima-50.jpg', 'http://localhost:9010/insulation-materials/technolight-optima-50.mp4', 'Минвата', 50, 'ТЕХНОНИКОЛЬ', 'Каркасные стены', '012889', 281.60, 'https://www.tstn.ru/product/bazaltovyy-uteplitel-tekhnonikol-tekhnolayt-optima-1200kh600kh50-mm-12-sht/', 1, now()),
  (2, 'Технолайт Экстра', 'Минераловатные плиты для теплоизоляции ненагружаемых конструкций.', 'published', 'http://localhost:9010/insulation-materials/technolight-extra-50.jpg', 'http://localhost:9010/insulation-materials/technolight-extra-50.mp4', 'Минвата', 50, 'ТЕХНОНИКОЛЬ', 'Ненагружаемые конструкции', '012203', 229.63, NULL, 1, now()),
  (3, 'THERM ППС15', 'Пенополистирольная плита для полов, перекрытий и стен.', 'published', 'http://localhost:9010/insulation-materials/rafinad-therm-50.jpg', 'http://localhost:9010/insulation-materials/rafinad-therm-50.mp4', 'Пенопласт', 50, 'RAFINAD', 'Полы и перекрытия', '142367', 322.22, NULL, 1, now()),
  (4, 'THERM FACADE', 'Пенополистирольная плита для фасадов под штукатурку.', 'published', 'http://localhost:9010/insulation-materials/rafinad-facade-50.jpg', 'http://localhost:9010/insulation-materials/rafinad-facade-50.mp4', 'Пенопласт', 50, 'RAFINAD', 'Фасады под штукатурку', '142357', 322.22, NULL, 1, now()),
  (5, 'LOGICPIR Баня', 'Теплоизоляционная плита с фольгированным покрытием для бань и саун.', 'published', 'http://localhost:9010/insulation-materials/logicpir-banya-50.jpg', 'http://localhost:9010/insulation-materials/logicpir-banya-50.mp4', 'PIR-плита', 50, 'ТЕХНОНИКОЛЬ', 'Бани и сауны', '684039', 1038.60, NULL, 1, now()),
  (6, 'LOGICPIR СХМ/СХМ', 'Теплоизоляционная PIR-плита для кровель и слоистых стен.', 'published', 'http://localhost:9010/insulation-materials/logicpir-skhm-50.jpg', 'http://localhost:9010/insulation-materials/logicpir-skhm-50.mp4', 'PIR-плита', 50, 'ТЕХНОНИКОЛЬ', 'Кровли и слоистые стены', '696675', 1570.15, NULL, 1, now()),
  (7, 'Технолайт Оптима 100', 'Черновик материала перед публикацией.', 'draft', NULL, NULL, 'Минвата', 100, 'ТЕХНОНИКОЛЬ', 'Каркасные стены', '012890', 563.19, NULL, 1, NULL),
  (8, 'Архивный Технолайт', 'Удалённая учебная запись.', 'deleted', NULL, NULL, 'Минвата', 50, 'ТЕХНОНИКОЛЬ', 'Архив', '012889-A', 281.60, NULL, 1, NULL);

SELECT setval(pg_get_serial_sequence('insulation_materials', 'insulation_material_id'), (SELECT max(insulation_material_id) FROM insulation_materials));

INSERT INTO insulation_material_likes (user_id, insulation_material_id)
SELECT user_id, material_id
FROM (VALUES (1, 24), (2, 15), (3, 12), (4, 9), (5, 18), (6, 21)) AS counts(material_id, like_count)
CROSS JOIN LATERAL generate_series(1, counts.like_count) AS user_id;
