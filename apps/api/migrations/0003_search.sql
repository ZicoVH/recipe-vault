-- Full-text index over title, ingredient names and tags (D9). unicode61 with
-- remove_diacritics 2 ignores case and accents. The rowid matches recipe.rowid
-- and the app keeps the index in sync (src/recipes/search.ts).
CREATE VIRTUAL TABLE recipe_fts USING fts5(
  title,
  ingredients,
  tags,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Index recipes that exist before this migration.
INSERT INTO recipe_fts (rowid, title, ingredients, tags)
SELECT
  r.rowid,
  r.title,
  COALESCE((SELECT group_concat(name, ' ') FROM ingredient WHERE recipe_id = r.id), ''),
  COALESCE((SELECT group_concat(name, ' ') FROM tag WHERE recipe_id = r.id), '')
FROM recipe r;
