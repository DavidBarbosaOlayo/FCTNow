# FCTNow Backend

Backend base para FCTNow construido con Java 21, Spring Boot 3, Maven y PostgreSQL.

## Requisitos

- Java 21
- Maven 3.6+
- Docker con `docker-compose` clásico o el plugin `docker compose`

## Base de datos local

Desde la raíz del repositorio:

```bash
docker-compose up -d postgres
```

Si tu entorno tiene el plugin moderno de Docker:

```bash
docker compose up -d postgres
```

Credenciales por defecto:

- Base de datos: `fctnow`
- Usuario: `fctnow`
- Password: `fctnow`
- Puerto publicado por defecto: `15432`

## Arranque del backend

```bash
cd backend
mvn spring-boot:run
```

## Tests

```bash
cd backend
mvn test
```

El perfil por defecto es `local`. Se puede sobrescribir la conexion con variables de entorno:

```bash
FCTNOW_DB_URL=jdbc:postgresql://localhost:15432/fctnow \
FCTNOW_DB_USERNAME=fctnow \
FCTNOW_DB_PASSWORD=fctnow \
mvn spring-boot:run
```

## Endpoints base

- Healthcheck: `GET http://localhost:8080/api/health`
- Login: `POST http://localhost:8080/api/auth/login`
- Usuario autenticado: `GET http://localhost:8080/api/auth/me`
- OpenAPI JSON: `http://localhost:8080/api/openapi`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`

## Autenticacion

La API usa autenticacion JWT stateless para los endpoints protegidos bajo `/api/**`.
Quedan publicos `POST /api/auth/login`, `GET /api/health` y la documentacion OpenAPI/Swagger.

Roles base del dominio:

- `ALUMNO`
- `EMPRESA`
- `TUTOR_CENTRO`
- `COORDINADOR`
- `ADMIN`

Configuracion relevante:

```bash
FCTNOW_JWT_SECRET=change-this-local-secret-with-at-least-32-bytes
FCTNOW_JWT_EXPIRATION=PT1H
```

No se crea un usuario inicial de desarrollo por defecto. Los usuarios deben existir en las
tablas `app_users` y `user_roles`; los tests crean sus propios datos.

## Integracion con Adzuna

El endpoint `GET /api/ofertas/externas` consulta la API de Adzuna en el backend y devuelve
ofertas reales mapeadas a un DTO interno. Las credenciales se leen de variables de entorno y no
se exponen al frontend:

```bash
ADZUNA_APP_ID=tu-app-id
ADZUNA_APP_KEY=tu-app-key
ADZUNA_COUNTRY=es
ADZUNA_BASE_URL=https://api.adzuna.com/v1/api/jobs
ADZUNA_TIMEOUT=PT8S
```

Si `ADZUNA_APP_ID` o `ADZUNA_APP_KEY` no estan presentes el endpoint responde
`503 Service Unavailable` y el frontend hace fallback mostrando solo el catalogo interno.

Las ofertas externas no se importan al catalogo interno. Cuando un alumno aplica fuera de
FCTNow puede registrar manualmente el seguimiento con `POST /api/alumno/solicitudes-externas`,
consultarlo con `GET /api/alumno/solicitudes-externas` y cambiar su estado con
`PATCH /api/alumno/solicitudes-externas/{id}/estado`.

Estados soportados para solicitudes externas:

- `SOLICITADA`
- `ACEPTADA`
- `RECHAZADA`
- `RETIRADA`

El paso a `ACEPTADA` lo declara el alumno cuando la empresa externa le confirma la plaza. El
personal de centro consulta esas candidatas con `GET /api/asignaciones/externas/candidatas` y
crea la asignacion desde `POST /api/asignaciones/externas`, manteniendo el snapshot y la
atribucion a Adzuna aunque la publicacion original caduque.

## Migraciones

Flyway ejecuta las migraciones de `src/main/resources/db/migration` al arrancar la aplicacion.

La primera migracion crea una tabla tecnica `backend_metadata` para validar que la conexion y
el pipeline de migraciones funcionan sin introducir todavia entidades de dominio FCT.
