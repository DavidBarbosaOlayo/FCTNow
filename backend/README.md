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

El perfil por defecto es `local`. Se puede sobrescribir la conexion con variables de entorno:

```bash
FCTNOW_DB_URL=jdbc:postgresql://localhost:15432/fctnow \
FCTNOW_DB_USERNAME=fctnow \
FCTNOW_DB_PASSWORD=fctnow \
mvn spring-boot:run
```

## Endpoints base

- Healthcheck: `GET http://localhost:8080/api/health`
- OpenAPI JSON: `http://localhost:8080/api/openapi`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`

## Migraciones

Flyway ejecuta las migraciones de `src/main/resources/db/migration` al arrancar la aplicacion.

La primera migracion crea una tabla tecnica `backend_metadata` para validar que la conexion y
el pipeline de migraciones funcionan sin introducir todavia entidades de dominio FCT.
