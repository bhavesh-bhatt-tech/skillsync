# SkillSync

SkillSync helps interviewers and candidates collect, organize, practice, and maintain technical interview questions in one place.

## Technology Stack

- **Front End Development:** React, TypeScript, Vite, Tailwind CSS, React Markdown, Monaco Editor, Lucide React
- **Back End Development:** Node.js, Express, TypeScript, Fetch API client
- **Database and Data Management:** PostgreSQL, Prisma ORM, Prisma schema, database seed scripts, transactional batch updates
- **Question Management:** XLSX import and export, topic and subtopic organization, filtering, pagination, duplicate detection, update-on-reimport
- **Authentication and API Protection:** Session-based Admin key, `sessionStorage`, `x-admin-key` request headers, Admin CRUD and import/export APIs
- **Unit Testing:** Vitest, React component tests, JSDOM
- **Code Coverage:** V8 coverage provider, text reports, HTML reports, LCOV reports
- **Component Development:** Storybook, component state stories, isolated UI testing
- **Code Quality:** SonarQube source analysis, test discovery, coverage integration
- **Containerization:** Docker multi-stage builds, Docker Compose, Nginx, PostgreSQL volumes, service health checks
- **Continuous Integration:** GitHub Actions, dependency installation, Prisma client generation, unit tests, coverage, application builds, Storybook builds
- **Monitoring and Logging:** Express health endpoint, structured backend logs, error logs

## What You Can Do

- Find the right question quickly by searching question text and answers.
- Narrow practice sessions by topic, subtopic, role, skill, or minimum experience.
- Browse questions in a clear topic and subtopic hierarchy.
- Read conceptual explanations with headings, lists, tables, Markdown, and easy-to-read code examples.
- Practice coding questions in an editor with syntax coloring, copy, and reset actions.
- Move through large question collections with 10-question pages.
- Add, edit, and remove questions from the management area.
- Upload an XLSX workbook to add new questions or update existing questions automatically when their topic and question match.
- Download the complete question collection as an XLSX workbook or start from a ready-made template.
- Use any question type and organize topics such as Java, Cloud & DevOps, Messaging, and Databases.
- Run the app locally or with Docker, with persistent question storage and health checks.
- Review component states in Storybook and verify behavior with automated tests and coverage reports.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the Mermaid system diagram.

The frontend calls the Express API configured by `VITE_API_BASE_URL`. The API uses Prisma to read and write PostgreSQL.

## Environment Variables

Create a root `.env` file for local frontend development:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ADMIN_KEY=replace-with-a-local-admin-key
```

`VITE_*` values are embedded into the frontend at startup/build time. They are not runtime server secrets. The Admin key is therefore a frontend gate; production deployments that require real authorization must validate `x-admin-key` in the backend or API gateway.

## Docker Compose

Prerequisites: Docker Desktop with Compose support.

From the project root:

```bash
# Bash, macOS, or Linux
export VITE_ADMIN_KEY=replace-with-your-admin-key
docker compose up --build
```

```powershell
# Windows PowerShell
$env:VITE_ADMIN_KEY = 'replace-with-your-admin-key'
docker compose up --build
```

Open `http://localhost:5173`. The containers are:

- Frontend: Nginx on port `5173`.
- Backend: Express on port `5000`.
- PostgreSQL: internal Compose service with persistent `postgres_data` volume.

PostgreSQL starts first, the backend waits for its health check, and the backend initializes Prisma before starting. Stop containers with `docker compose down`; add `-v` only when you intentionally want to delete the database volume.

## Local Development Without Docker

Prerequisites: Node.js 20+ and PostgreSQL.

1. Configure the backend in `server/.env`:

```env
DATABASE_URL=postgresql://interview:interview@localhost:5432/interview_hub?schema=public
```

2. Start the backend from the project root:

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev:backend
```

3. In a second terminal, configure the frontend and start Vite:

```bash
npm run dev:frontend
```

The frontend is normally available at `http://localhost:5173` and the API at `http://localhost:5000`. If `VITE_API_BASE_URL` is omitted, the frontend defaults to `http://localhost:5000/api`.

## Testing and Coverage

Run unit tests:

```bash
npm test
```

Generate coverage:

```bash
npm run test:coverage
```

Coverage output is written to `coverage/`, including `coverage/index.html` for the browser report and `coverage/lcov.info` for SonarQube/CI integrations. The configured XLSX parser test is in `src/lib/xlsx.test.ts`.

## Storybook

Start Storybook:

```bash
npm run storybook
```

Build it for CI or deployment:

```bash
npm run build-storybook
```

The sample stories are in `src/components/QuestionCard.stories.tsx`.

## CI and SonarQube

`.github/workflows/ci.yml` installs dependencies, generates Prisma, runs tests with coverage, builds the application, and builds Storybook on pushes and pull requests. `sonar-project.properties` maps source, test, LCOV, and test-report paths.

## Backend Logs

The backend creates `logs/` automatically and writes structured entries to:

```text
logs/backend-log.log
logs/error.log
```

Entries are also printed to the backend terminal.

## XLSX Format

The first worksheet should contain these columns:

| Header | Required | Notes |
|---|---:|---|
| `topic` | Yes | Any topic, such as `Java`, `Cloud & DevOps`, `Messaging`, or `Databases` |
| `subtopic` | Yes | Secondary grouping |
| `question` | Yes | Used with `topic` as the import upsert identity |
| `answer` | Yes | Markdown answer |
| `type` | No | Any non-empty value; defaults to `CONCEPTUAL` |
| `starterCode` | No | Starter code for coding questions |
| `skills` | No | Pipe- or comma-separated |
| `roles` | No | Pipe- or comma-separated |
| `minExperience` | No | Integer, default `0` |

## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Database-backed health check |
| GET | `/api/questions` | List questions with optional filters |
| POST | `/api/questions` | Create a question |
| PUT | `/api/questions/:id` | Update a question |
| DELETE | `/api/questions/:id` | Delete a question |
| POST | `/api/questions/batch` | XLSX import upsert |

## Project Structure

```text
.
├── .github/workflows/ci.yml
├── .storybook/                  # Storybook configuration
├── prisma/                      # Prisma schema and seed data
├── server/                      # Express API and logger
├── src/                         # React frontend and Vitest tests
├── ARCHITECTURE.md              # Mermaid architecture diagram
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── sonar-project.properties
└── vitest.config.ts
```
