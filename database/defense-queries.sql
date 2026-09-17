-- Скриншоты 1–2: логическое удаление в Adminer и проверка результата.
UPDATE insulation_materials SET status = 'deleted' WHERE insulation_material_id = 2;
SELECT insulation_material_id, name, status FROM insulation_materials ORDER BY insulation_material_id;

-- Скриншоты после добавления и после публикации карточки.
SELECT insulation_material_id, name, status, short_description, insulation_type,
       thickness_mm, image_url, video_url, created_at, published_at, creator_id
FROM insulation_materials ORDER BY insulation_material_id;

-- Скриншоты 11–13: изменение двух предметных полей и количества строк M:N.
UPDATE insulation_materials
SET insulation_type = 'Каменная вата', thickness_mm = 80
WHERE insulation_material_id = 1;

INSERT INTO insulation_material_likes (user_id, insulation_material_id)
VALUES (25, 1)
ON CONFLICT (user_id, insulation_material_id) DO NOTHING;

SELECT m.insulation_material_id, m.name, m.insulation_type, m.thickness_mm,
       count(l.insulation_material_like_id) AS likes_count
FROM insulation_materials AS m
LEFT JOIN insulation_material_likes AS l USING (insulation_material_id)
WHERE m.insulation_material_id = 1
GROUP BY m.insulation_material_id;
