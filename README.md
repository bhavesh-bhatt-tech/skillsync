# SkillSync

<div align="center">
  <img alt="SkillSync" src="https://img.shields.io/badge/SkillSync-Interview%20Question%20Assistant-0A7EA4?style=for-the-badge&logo=github" />
  <br />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Vitest" src="https://img.shields.io/badge/Vitest-Testing-6E9F18?logo=vitest&logoColor=white" />
  <img alt="Coverage" src="https://img.shields.io/badge/Code%20Coverage-Available-8A2BE2" />
</div>

## Contributions

<div style="font-family: Georgia, 'Times New Roman', serif; background: #f8fafc; border-left: 4px solid #64748b; border-radius: 10px; padding: 1rem 1.25rem; margin: 1rem 0 1.5rem; color: #1f2937; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);">
  <h3 style="margin: 0 0 0.5rem; font-family: Georgia, 'Times New Roman', serif; font-size: 1.35rem; letter-spacing: 0.04em; color: #0f172a;">Overall System Design & Architecture</h3>
  <p style="margin: 0; font-size: 1rem; line-height: 1.7; color: #374151;">Designed and architected by <em>Bhavesh Bhatt</em></p>
  <hr style="border: 0; border-top: 1px solid #d1d5db; margin: 0.8rem 0 1rem;" />

  <h3 style="margin: 0 0 0.5rem; font-family: Georgia, 'Times New Roman', serif; font-size: 1.35rem; letter-spacing: 0.04em; color: #0f172a;">Concept & User Experience</h3>
  <p style="margin: 0; font-size: 1rem; line-height: 1.7; color: #374151;">Conceived and designed by <em>Bhavesh Bhatt</em></p>
  <hr style="border: 0; border-top: 1px solid #d1d5db; margin: 0.8rem 0 1rem;" />

  <h3 style="margin: 0 0 0.5rem; font-family: Georgia, 'Times New Roman', serif; font-size: 1.35rem; letter-spacing: 0.04em; color: #0f172a;">Technology Stack & Engineering Decisions</h3>
  <p style="margin: 0; font-size: 1rem; line-height: 1.7; color: #374151;">Selected and structured by <em>Bhavesh Bhatt</em></p>
  <hr style="border: 0; border-top: 1px solid #d1d5db; margin: 0.8rem 0 1rem;" />

  <h3 style="margin: 0 0 0.5rem; font-family: Georgia, 'Times New Roman', serif; font-size: 1.35rem; letter-spacing: 0.04em; color: #0f172a;">Cloud & Deployment</h3>
  <p style="margin: 0; font-size: 1rem; line-height: 1.7; color: #374151;">Configured and orchestrated by <em>Bhavesh Bhatt</em></p>
</div>

SkillSync helps interviewers and candidates collect, organize, practice, and maintain technical interview questions in one place.

## Quality, Monitoring & Production Links

- **Code Coverage:** [Coverage & Testing](#technology-stack)  
- **Code Quality / SonarQube:** [Architecture Overview](#architecture)  
- **Monitoring / Logs:** [Environment & Runtime](#environment-variables)  
- **API Management / Swagger:** [API & Backend](#architecture)  
- **Production Frontend:** [Vercel App](https://skillsync-five-neon.vercel.app/)  
- **Production Backend:** [Render API](https://skill-sync-api.onrender.com/)  
- **Health Check:** [Render Health](https://skill-sync-api.onrender.com/health)  
- **Local Setup:** [Docker Compose](#docker-compose)  
- **Development Guide:** [Local Development](#local-development-without-docker)  

## Technology Stack

- **Front End :** React, TypeScript, Vite, Tailwind CSS, React Markdown, Monaco Editor, Lucide React
- **Back End :** Node.js, Express, TypeScript, Fetch API client
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

## Application Use

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

## Neon Postgres

SkillSync uses Neon only for its PostgreSQL database; it does not currently use Neon Auth, Object Storage, Functions, or AI Gateway. Link the existing Neon project from an external command line in the project root:

```bash
neon link --org-id org-frosty-mouse-76892183 --project-id quiet-violet-12967351
neon env pull --file server/.env
```

The link metadata is stored in the ignored `.neon` file. `neon env pull` writes the branch connection string as `DATABASE_URL`; Prisma and the Express backend use that value. Never commit `server/.env` or any Neon API key. The frontend continues to use `VITE_API_BASE_URL` to reach the Express API and does not connect directly to Neon.

For VS Code or another MCP-compatible client, the workspace includes the official Neon MCP endpoint in `.vscode/mcp.json`. Start the MCP server from the client and complete Neon OAuth when prompted. MCP is for database/project operations; application traffic still goes through the Express API.

## Environment Variables

The root `.env` is the canonical local environment file. Vite reads the `VITE_*` values, while Prisma and the Express backend read `DATABASE_URL`, `DATABASE_PASS`, and `PORT`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ADMIN_KEY=
DATABASE_URL="postgresql://user:__DATABASE_PASS__@your-neon-host/neondb?sslmode=require&channel_binding=require"
DATABASE_PASS=replace-with-your-database-password
PORT=5000
```

The committed `server/.env.example` remains a safe template for running the backend as a standalone package, but the normal project commands use the root `.env`. When `DATABASE_URL` contains `__DATABASE_PASS__`, the backend URL-encodes and substitutes `DATABASE_PASS` at startup. You may instead provide a complete `DATABASE_URL`; `DATABASE_PASS` is then optional. Do not commit either `.env` file or any real database password.

Set `VITE_ADMIN_KEY` in the host environment before starting or building the frontend. For local PowerShell, use `$env:VITE_ADMIN_KEY = 'your-key'`; for Docker Compose, set the same host variable before `docker compose up --build`. The Admin guard reads it through `import.meta.env.VITE_ADMIN_KEY`; no key is hard-coded in the application.

`VITE_*` values are embedded into the frontend at startup/build time. They are not runtime server secrets. The Admin key is therefore a frontend gate; production deployments that require real authorization must validate `x-admin-key` in the backend or API gateway.

## Docker Compose

Prerequisites: Docker Desktop with Compose support.

From the project root:

```bash
# Bash, macOS, or Linux
export VITE_ADMIN_KEY=replace-with-your-admin-key
export DATABASE_PASS=replace-with-your-database-password
docker compose up --build
```

```powershell
# Windows PowerShell
$env:VITE_ADMIN_KEY = 'replace-with-your-admin-key'
$env:DATABASE_PASS = 'replace-with-your-database-password'
docker compose up --build
```

Open `http://localhost:5173`. The containers are:

- Frontend: Nginx on port `5173`.
- Backend: Express on port `5000`.
- PostgreSQL: the local Compose database, persisted in the `postgres_data` volume.

PostgreSQL starts first, the backend waits for its health check, and Prisma initializes the schema before the backend starts. The backend exposes a health check at `/health`. Stop containers with `docker compose down`; add `-v` only when you intentionally want to delete the database volume.

## Local Development Without Docker

Prerequisites: Node.js 20+ and PostgreSQL.

1. Configure the backend in the root `.env` or `server/.env`:

```env
DATABASE_URL="postgresql://user:password@your-database-host/database?sslmode=require"
DATABASE_PASS=your-database-password
PORT=5000
```

2. Start the backend from the project root:

```bash
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run dev:backend
```

3. In a second terminal, configure the frontend and start Vite:

```bash
npm run dev:frontend
```

For deployment from the repository root, start the backend with:

```bash
npm start
```

This runs `tsx server/index.ts` on port `5000`. When deploying from inside the `server` directory instead, use `npm start` there as well; both package scripts start the same Express backend.

### Render deployment

For a Render Web Service using the repository root:

```text
Build Command: npm install && npx prisma generate
Start Command: npm start (synchronizes the Prisma schema before starting the API)
```

Set both `DATABASE_URL` and `DATABASE_PASS` as Render environment variables. `DATABASE_URL` is the complete Neon connection string; `DATABASE_PASS` is used only when the URL contains `__DATABASE_PASS__`. Set `VITE_API_BASE_URL` to the public backend URL followed by `/api` when deploying the frontend separately. Render supplies `PORT` automatically; the backend uses it and falls back to `5000` locally.

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
