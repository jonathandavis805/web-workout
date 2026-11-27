CREATE TABLE user (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  oauth_provider TEXT NOT NULL,
  oauth_id TEXT NOT NULL,
  UNIQUE (oauth_provider, oauth_id)
);

CREATE TABLE session (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE workout (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  spotify_url TEXT,
  circuits INTEGER,
  is_public INTEGER
);
CREATE INDEX workout_user ON workout (user_id);

CREATE TABLE exercise (
  id INTEGER PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workout (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  "order" INTEGER NOT NULL
);
CREATE INDEX exercise_workout ON exercise (workout_id);

-- Completions outlive their workout so deleting a workout keeps the stats history.
CREATE TABLE workout_completion (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  workout_id INTEGER REFERENCES workout (id) ON DELETE SET NULL,
  completed_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL
);
CREATE INDEX completion_user_date ON workout_completion (user_id, completed_at);

CREATE TABLE tv_device (
  id INTEGER PRIMARY KEY,
  name TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  pair_code TEXT UNIQUE,
  pair_expires_at TEXT,
  user_id INTEGER REFERENCES user (id) ON DELETE CASCADE,
  paired_at TEXT
);
