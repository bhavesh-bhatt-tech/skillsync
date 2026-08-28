/*
# Create questions table (single-tenant, no auth)

1. New Tables
- `questions`
  - id (uuid, primary key, defaults to gen_random_uuid())
  - topic (text, not null) — top-level grouping, e.g. "Java"
  - subtopic (text, not null) — secondary grouping, e.g. "Concurrency"
  - question (text, not null) — question question
  - answer (text, not null) — markdown-formatted answer
  - type (text, not null) — "CONCEPTUAL" | "CODING"
  - starter_code (text, nullable) — starter code for CODING questions
  - skills (text[], default '{}') — e.g. ["Java 21","Spring Boot"]
  - roles (text[], default '{}') — e.g. ["Tech Lead","Software Architect"]
  - min_experience (int, default 0) — minimum years of experience
  - created_at (timestamptz, default now())

2. Indexes
- idx_questions_topic_subtopic on (topic, subtopic) for accordion grouping
- idx_questions_type on (type)
- GIN indexes on skills and roles for array membership filtering

3. Security
- Enable RLS on `questions`.
- Allow anon + authenticated full CRUD because this is an intentionally public/shared
  single-tenant admin app with no sign-in screen.
*/

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  subtopic text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  type text NOT NULL,
  starter_code text,
  skills text[] NOT NULL DEFAULT '{}',
  roles text[] NOT NULL DEFAULT '{}',
  min_experience int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questions_topic_subtopic ON questions (topic, subtopic);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions (type);
CREATE INDEX IF NOT EXISTS idx_questions_skills_gin ON questions USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_questions_roles_gin ON questions USING GIN (roles);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_questions" ON questions;
CREATE POLICY "anon_select_questions" ON questions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_questions" ON questions;
CREATE POLICY "anon_insert_questions" ON questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_questions" ON questions;
CREATE POLICY "anon_update_questions" ON questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_questions" ON questions;
CREATE POLICY "anon_delete_questions" ON questions FOR DELETE
  TO anon, authenticated USING (true);
