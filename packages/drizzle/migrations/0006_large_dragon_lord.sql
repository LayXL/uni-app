-- Custom SQL migration file, put your code below! --
UPDATE config
SET json = REPLACE(json::text, 'Бистро \"Апельсин\"', 'Буфет')::json
WHERE id = 'buildingScheme';