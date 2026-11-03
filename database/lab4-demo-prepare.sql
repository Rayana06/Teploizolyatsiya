-- Подготовка данных для скриншотов ЛР4.
-- Выполнить в Adminer перед показом. Пароль обоих пользователей: Teplo123!

INSERT INTO users (user_id, email, display_name, password_hash)
VALUES
  (1, 'user1@teploshchit.local', 'Анна Смирнова', 'daf7f72c16df4422223fcb1d4a844c53:151dcbbd2cfc08884ce74cc8d1011bc603147e51ec4bb7655df5fd73e1c80a0a26890c6e4411f8adbb2820660f2f208b32860251c1d1bec0670a37a3c7a87c11'),
  (2, 'user2@teploshchit.local', 'Мария Петрова', 'daf7f72c16df4422223fcb1d4a844c53:151dcbbd2cfc08884ce74cc8d1011bc603147e51ec4bb7655df5fd73e1c80a0a26890c6e4411f8adbb2820660f2f208b32860251c1d1bec0670a37a3c7a87c11')
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  password_hash = EXCLUDED.password_hash;

DELETE FROM insulation_material_likes WHERE insulation_material_id IN (9000, 9001);
DELETE FROM insulation_materials WHERE insulation_material_id IN (9000, 9001) OR (creator_id = 1 AND status = 'draft');

INSERT INTO insulation_materials
  (insulation_material_id, name, short_description, status, image_url, video_url, insulation_type, thickness_mm, creator_id, published_at)
VALUES
  (9000, 'Технолайт — демо ЛР4', 'Опубликованная услуга для публичного GET.', 'published', NULL, NULL, 'Минвата', 100, 1, now()),
  (9001, 'Эковата — демо ЛР4', 'Черновик для проверки прав публикации.', 'draft', NULL, NULL, 'Эковата', 150, 1, NULL);

SELECT setval(
  pg_get_serial_sequence('insulation_materials', 'insulation_material_id'),
  GREATEST(9001, (SELECT max(insulation_material_id) FROM insulation_materials))
);

SELECT insulation_material_id, name, status, creator_id, published_at
FROM insulation_materials
WHERE insulation_material_id IN (9000, 9001)
ORDER BY insulation_material_id;
