-- Recipes and their ordered parts. Order is kept in the position columns.
-- deleted_at is the trash state: NULL means active (ticket 1.5 uses it).
CREATE TABLE recipe (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  servings INTEGER NOT NULL CHECK (servings >= 1),
  prep_time_minutes INTEGER CHECK (prep_time_minutes IS NULL OR prep_time_minutes >= 1),
  cook_time_minutes INTEGER CHECK (cook_time_minutes IS NULL OR cook_time_minutes >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE ingredient (
  recipe_id TEXT NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  note TEXT,
  PRIMARY KEY (recipe_id, position)
);

CREATE TABLE step (
  recipe_id TEXT NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text TEXT NOT NULL,
  PRIMARY KEY (recipe_id, position)
);

-- One tag per recipe ignoring case (D13). The API also dedupes, this is the backstop.
CREATE TABLE tag (
  recipe_id TEXT NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (recipe_id, position),
  UNIQUE (recipe_id, name COLLATE NOCASE)
);
CREATE INDEX tag_name ON tag (name COLLATE NOCASE);
