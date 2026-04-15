CREATE TABLE IF NOT EXISTS recipes (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  berries TEXT NOT NULL,
  count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_key TEXT NOT NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
