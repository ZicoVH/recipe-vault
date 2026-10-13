-- Key the search index on the recipe id instead of recipe.rowid. recipe has a
-- TEXT primary key, so SQLite does not guarantee that its rowids survive VACUUM.
-- Recipes that exist now are re-indexed without ligature folding. The app
-- re-indexes a recipe with folding whenever it is created or updated.
DROP TABLE recipe_fts;

CREATE VIRTUAL TABLE recipe_fts USING fts5(
  recipe_id UNINDEXED,
  title,
  ingredients,
  tags,
  tokenize = 'unicode61 remove_diacritics 2'
);

INSERT INTO recipe_fts (recipe_id, title, ingredients, tags)
SELECT
  r.id,
  r.title,
  COALESCE((SELECT group_concat(name, ' ') FROM ingredient WHERE recipe_id = r.id), ''),
  COALESCE((SELECT group_concat(name, ' ') FROM tag WHERE recipe_id = r.id), '')
FROM recipe r;
