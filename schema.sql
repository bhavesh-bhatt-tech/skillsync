-- ============================================================
-- Interview Question Revision & Management — Raw PostgreSQL DDL
-- Initialize the database manually via psql / pgAdmin without Prisma:
--   psql -U <user> -d <dbname> -f schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS "Question" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "topic"         TEXT NOT NULL,
  "subtopic"      TEXT NOT NULL,
  "question"         TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "type"          TEXT NOT NULL,
  "starterCode"   TEXT,
  "skills"        TEXT[] NOT NULL DEFAULT '{}',
  "roles"         TEXT[] NOT NULL DEFAULT '{}',
  "minExperience" INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_questions_topic_subtopic"
  ON "Question" ("topic", "subtopic");
CREATE INDEX IF NOT EXISTS "idx_questions_type"
  ON "Question" ("type");
CREATE INDEX IF NOT EXISTS "idx_questions_skills_gin"
  ON "Question" USING GIN ("skills");
CREATE INDEX IF NOT EXISTS "idx_questions_roles_gin"
  ON "Question" USING GIN ("roles");
