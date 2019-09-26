CREATE TABLE IF NOT EXISTS "pghero_space_stats" (
  "id" serial primary key,
  "database" text,
  "schema" text,
  "relation" text,
  "size" bigint,
  "captured_at" timestamp
);
CREATE INDEX IF NOT EXISTS ON "pghero_space_stats" ("database", "captured_at");