# AGENTS.md

## Project overview

This repository is the monorepo for `FCTNow`, a web application for managing
`Formacion en Centros de Trabajo (FCT)` in Spanish vocational training centers.

The product goal, based on `MemoriaFCTConnect.pdf`, is to centralize the full FCT
lifecycle:

- company and internship offer management
- student profiles and preferences
- applications and assignment workflow
- internship follow-up and final evaluation
- document handling and reporting

Primary actors in the domain:

- `ALUMNO`
- `EMPRESA`
- `TUTOR_CENTRO`
- `COORDINADOR`
- `ADMIN`

## Current repository state

The repo currently contains:

- `frontend/`: Angular 20 application with SSR enabled.
- `backend/`: Spring Boot 3 backend base with PostgreSQL, Flyway, OpenAPI,
  healthcheck, stateless JWT authentication and FCT role support.
- `docker-compose.yml`: local PostgreSQL service for development.
- `MemoriaFCTConnect.pdf`: initial product memory and domain reference.
- `README.md`: general monorepo setup and validation guide.

The backend exists in this repository today, but it is still a technical base. It
does not yet include public registration, complete user administration, FCT domain
CRUD, company management, offer management, applications, assignments, follow-up,
evaluation or document workflows.

When making changes, distinguish clearly between:

- the code that actually exists in this repo
- the planned product architecture and domain workflow from the memory
- future backend capabilities that still need their own issues

Use the current codebase as the source of truth for implementation details, and
the memory as the source of truth for product intent and domain vocabulary.

## Tech stack

Frontend:

- `Angular 20`
- `TypeScript`
- `Angular SSR` with Express entrypoint in `frontend/src/server.ts`
- `Jasmine + Karma` for frontend tests

Backend:

- `Java 21`
- `Spring Boot 3`
- `Spring Security`
- `JWT` stateless authentication
- `PostgreSQL`
- `Flyway`
- `springdoc-openapi`
- `JUnit` / Spring Boot tests

Key files and folders:

- `frontend/package.json`
- `frontend/angular.json`
- `frontend/src/main.ts`
- `frontend/src/server.ts`
- `frontend/src/app/app.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/auth/`
- `frontend/src/app/core/`
- `backend/pom.xml`
- `backend/src/main/java/com/fctnow/backend/`
- `backend/src/main/resources/`
- `backend/src/test/`
- `docker-compose.yml`

## Commands

Use these commands from the repo root unless a `cd` is shown.

Frontend setup:

```bash
cd frontend
npm install
```

Frontend development server:

```bash
cd frontend
npm start
```

Frontend build:

```bash
cd frontend
npm run build
```

Frontend tests:

```bash
cd frontend
npm test -- --watch=false --browsers=ChromeHeadless
```

PostgreSQL for local backend development:

```bash
docker-compose up -d postgres
```

If the environment uses the modern Docker plugin:

```bash
docker compose up -d postgres
```

Backend tests:

```bash
cd backend
mvn test
```

Backend development server:

```bash
cd backend
mvn spring-boot:run
```

Minimum monorepo validation before opening a functional PR:

```bash
cd frontend
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
cd ../backend
mvn test
```

If Docker is not available, backend unit/integration tests can still run with the
test profile and H2. Full local runtime with PostgreSQL requires Docker or a
compatible database configured through environment variables.

## Existing backend API surface

The backend currently exposes these base endpoints:

- `GET http://localhost:8080/api/health`
- `POST http://localhost:8080/api/auth/login`
- `GET http://localhost:8080/api/auth/me`
- `GET http://localhost:8080/api/openapi`
- `GET http://localhost:8080/api/swagger-ui.html`

Authentication is JWT-based and stateless. `/api/auth/login`, `/api/health` and
OpenAPI/Swagger are public; protected `/api/**` endpoints require a bearer token.

Current role vocabulary:

- `ALUMNO`
- `EMPRESA`
- `TUTOR_CENTRO`
- `COORDINADOR`
- `ADMIN`

Do not claim that company, offer, application, assignment, follow-up, evaluation
or document endpoints exist until they are implemented in `backend/`.

## Product and UX guidance

When implementing product features, align with the FCT workflow described in the
memory:

1. authentication and role-based access
2. company and offer management
3. student profile and preferences
4. applications and assignment
5. follow-up and evaluation
6. documentation and reporting

The application is for educational staff, companies and students, so prioritize:

- clear and low-friction flows
- explicit validation and error states
- responsive layouts
- accessible forms and navigation
- Spanish copy by default unless the task asks for another language

Avoid generic demo content once real feature work starts.

## Frontend architecture expectations

Prefer Angular patterns that scale cleanly:

- use standalone components and Angular's modern APIs
- keep routing in `frontend/src/app/app.routes.ts` or feature route files
- keep business logic out of templates
- use strongly typed interfaces/models for domain entities
- isolate API access behind services
- keep presentation components separate from data-fetching concerns when
  complexity grows
- keep browser-only APIs behind SSR-safe boundaries

Current and suggested frontend feature areas:

- `frontend/src/app/auth/`
- `frontend/src/app/core/`
- `frontend/src/app/alumnos/`
- `frontend/src/app/empresas/`
- `frontend/src/app/fct/`
- `frontend/src/app/admin/`

If you introduce these areas, keep naming consistent with the domain and avoid
mixing unrelated responsibilities in the same folder.

## Backend architecture expectations

Prefer Spring Boot patterns that keep the backend ready to grow:

- keep controllers thin and delegate behavior to services
- keep persistence behind repositories
- use DTOs/records for API requests and responses
- validate input with Jakarta Validation
- protect `/api/**` consistently with Spring Security
- keep JWT and role behavior centralized in auth/security components
- use Flyway migrations for database schema changes
- avoid introducing domain entities without clear acceptance criteria and tests

Model future API work around REST resources and do not hardcode production
endpoints in frontend code. Keep base URLs and environment-specific config
centralized.

## Coding guidance

- keep code and filenames in English when technical, but keep domain terms
  accurate
- use descriptive names tied to the FCT domain
- prefer small, composable components and services
- add comments only when a block is not obvious from the code itself
- preserve Angular SSR compatibility unless the user explicitly wants to remove
  it
- keep frontend and backend responsibilities separate

When adding forms:

- use Angular form APIs consistently
- validate required fields, formats and role-specific constraints
- show actionable error messages

When adding routes or guarded experiences:

- design with role separation in mind
- avoid exposing admin/tutor flows in student-facing screens
- protect authenticated routes in the frontend and enforce authorization in the
  backend when corresponding APIs exist

## Testing expectations

For non-trivial changes, add or update tests where practical.

Frontend focus:

- component behavior
- form validation
- service logic
- route/role-related behavior

Backend focus:

- controller behavior
- service logic
- validation and error responses
- security and role-related behavior
- repository or migration behavior when persistence changes

If tests are not added, explain why.

## Definition of done

A task is in good shape when:

- the change matches the FCTNow domain and current repo reality
- the UI is not left in demo/scaffold state for the touched area
- backend behavior is not claimed unless implemented and tested
- builds and relevant tests pass, or failures are explained
- new files and names follow the project structure consistently
- documentation stays aligned with the monorepo structure

## Things to avoid

- treating placeholder screens as intentional product UI
- coupling components directly to mock data in a way that blocks real API
  integration
- introducing a second architecture style without a strong reason
- using domain language inconsistently across files and screens
- claiming backend domain functionality exists before it is implemented
- bypassing the API boundary between `frontend/` and `backend/`
