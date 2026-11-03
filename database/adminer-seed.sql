-- Выполнить один раз в Adminer: SQL-команда -> вставить весь файл -> Выполнить.
-- Схема создаётся миграцией TypeORM при первом запуске приложения.
-- Демонстрационный пароль всех учебных пользователей: Teplo123!

INSERT INTO users (user_id, email, display_name, password_hash)
SELECT number, 'user' || number || '@teploshchit.local', CASE WHEN number = 1 THEN 'Анна Смирнова' ELSE 'Пользователь ' || number END, 'daf7f72c16df4422223fcb1d4a844c53:151dcbbd2cfc08884ce74cc8d1011bc603147e51ec4bb7655df5fd73e1c80a0a26890c6e4411f8adbb2820660f2f208b32860251c1d1bec0670a37a3c7a87c11'
FROM generate_series(1, 25) AS number;

SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT max(user_id) FROM users));

INSERT INTO insulation_materials
  (insulation_material_id, name, short_description, status, image_url, video_url, insulation_type, thickness_mm, creator_id, published_at)
VALUES
  (1, 'Технолайт Оптима', 'Каменная вата для утепления каркасных стен и ненагружаемых перекрытий.', 'published', '/insulation-materials-assets/products/technolight-optima-50.jpg', '/insulation-materials-assets/products/technolight-optima-50.mp4', 'Минвата', 50, 1, now()),
  (2, 'Технолайт Экстра', 'Минераловатные плиты для теплоизоляции ненагружаемых конструкций.', 'published', '/insulation-materials-assets/products/technolight-extra-50.jpg', '/insulation-materials-assets/products/technolight-extra-50.mp4', 'Минвата', 50, 1, now()),
  (3, 'THERM ППС15', 'Пенополистирольная плита для полов, перекрытий и стен.', 'published', '/insulation-materials-assets/products/rafinad-therm-50.jpg', '/insulation-materials-assets/products/rafinad-therm-50.mp4', 'Пенопласт', 50, 1, now()),
  (4, 'THERM FACADE', 'Пенополистирольная плита для фасадов под штукатурку.', 'published', '/insulation-materials-assets/products/rafinad-facade-50.jpg', '/insulation-materials-assets/products/rafinad-facade-50.mp4', 'Пенопласт', 50, 1, now()),
  (5, 'LOGICPIR Баня', 'Теплоизоляционная плита с фольгированным покрытием для бань и саун.', 'published', '/insulation-materials-assets/products/logicpir-banya-50.jpg', '/insulation-materials-assets/products/logicpir-banya-50.mp4', 'PIR-плита', 50, 1, now()),
  (6, 'LOGICPIR СХМ/СХМ', 'Теплоизоляционная PIR-плита для кровель и слоистых стен.', 'published', '/insulation-materials-assets/products/logicpir-skhm-50.jpg', '/insulation-materials-assets/products/logicpir-skhm-50.mp4', 'PIR-плита', 50, 1, now()),
  (7, 'Технолайт Оптима 100', 'Черновик материала перед публикацией.', 'draft', NULL, NULL, 'Минвата', 100, 1, NULL),
  (8, 'Архивный Технолайт', 'Удалённая учебная запись.', 'deleted', NULL, NULL, 'Минвата', 50, 1, NULL);

SELECT setval(pg_get_serial_sequence('insulation_materials', 'insulation_material_id'), (SELECT max(insulation_material_id) FROM insulation_materials));

INSERT INTO insulation_material_likes (user_id, insulation_material_id)
SELECT user_id, material_id
FROM (VALUES (1, 24), (2, 15), (3, 12), (4, 9), (5, 18), (6, 21)) AS counts(material_id, like_count)
CROSS JOIN LATERAL generate_series(1, counts.like_count) AS user_id;
