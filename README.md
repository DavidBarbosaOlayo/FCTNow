# FCTNow

Aplicacion web para la gestion de la Formacion en Centros de Trabajo (FCT): empresas,
ofertas, alumnado, solicitudes, asignaciones, seguimiento y evaluacion.

El repositorio contiene:

- `frontend/`: frontend Angular 20 con SSR.
- `backend/`: backend base Spring Boot 3 con PostgreSQL local.
- `docker-compose.yml`: servicio PostgreSQL para desarrollo.
- `MemoriaFCTConnect.pdf`: memoria inicial del proyecto.

## Requisitos

- Node.js y npm para el frontend.
- Java 21 y Maven 3.6+ para el backend.
- Docker con `docker-compose` clasico o el plugin `docker compose`.

## Frontend

Instalar dependencias:

```bash
cd frontend
npm install
```

Arrancar Angular:

```bash
cd frontend
npm start
```

Build:

```bash
cd frontend
npm run build
```

Tests:

```bash
cd frontend
npm test -- --watch=false --browsers=ChromeHeadless
```

## Backend

Levantar PostgreSQL desde la raiz del repositorio:

```bash
docker-compose up -d postgres
```

Si el entorno usa el plugin moderno de Docker:

```bash
docker compose up -d postgres
```

Arrancar el backend:

```bash
cd backend
mvn spring-boot:run
```

Tests:

```bash
cd backend
mvn test
```

Endpoints base:

- Healthcheck: `GET http://localhost:8080/api/health`
- OpenAPI JSON: `http://localhost:8080/api/openapi`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`

## Base de datos local

Configuracion por defecto:

- Host: `localhost`
- Puerto publicado por defecto: `15432`
- Base de datos: `fctnow`
- Usuario: `fctnow`
- Password: `fctnow`

Se puede sobrescribir con variables de entorno:

```bash
FCTNOW_DB_URL=jdbc:postgresql://localhost:15432/fctnow
FCTNOW_DB_USERNAME=fctnow
FCTNOW_DB_PASSWORD=fctnow
```

Flyway aplica las migraciones de `backend/src/main/resources/db/migration` al arrancar el
backend. La migracion inicial crea una tabla tecnica para validar conexion y pipeline de
migraciones sin introducir todavia entidades de dominio FCT.

## Alcance actual

El backend incluido aqui es una base tecnica: arranque, conexion PostgreSQL, Flyway,
healthcheck y OpenAPI. No incluye aun autenticacion JWT, roles, entidades FCT, CRUDs de
negocio ni integracion real con Angular.

## Validacion minima del monorepo

Antes de abrir una rama funcional nueva, valida desde `main` actualizado:

```bash
git fetch --prune origin
git merge --ff-only origin/main
cd frontend
npm install
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
cd ../backend
mvn test
```

Si Docker no esta disponible, la validacion de unidad sigue pudiendo ejecutarse con `mvn test`.
El arranque completo con PostgreSQL queda limitado hasta disponer de Docker o de una base de
datos compatible configurada por variables de entorno.
