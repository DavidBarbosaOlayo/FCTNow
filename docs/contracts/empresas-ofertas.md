# Contrato base de empresas y ofertas FCT

## Estado del documento

Este documento define el contrato funcional y tecnico minimo para las futuras
funcionalidades de empresas colaboradoras y ofertas FCT en FCTNow.

Importante: los endpoints descritos aqui son una propuesta contractual para
issues posteriores. En el estado actual del monorepo solo existen los endpoints
base de healthcheck, OpenAPI y autenticacion JWT. Este documento no implica que
`/api/empresas` ni `/api/ofertas` esten implementados.

## Objetivos

- Definir los modelos base `Empresa` y `OfertaFct`.
- Acordar campos, tipos, obligatoriedad y validaciones minimas.
- Definir estados iniciales y transiciones principales.
- Definir permisos esperados por rol FCTNow.
- Proponer endpoints REST futuros compatibles con Spring Boot, PostgreSQL,
  OpenAPI y Angular.
- Dejar una base estable para futuras issues de backend, frontend y pruebas.

## Decisiones de contrato

- El recurso tecnico de empresa se llamara `Empresa`.
- El recurso tecnico de oferta se llamara `OfertaFct` en Java y TypeScript.
- El recurso HTTP de ofertas sera `/api/ofertas`, manteniendo vocabulario de
  producto en castellano.
- La empresa usara `identificadorFiscal` como campo principal, acompanado de
  `tipoIdentificadorFiscal`. Esto evita bloquear el contrato solo a `CIF` y
  permite empresas, autonomos u otros identificadores.
- La oferta incluira `familiaProfesional` como campo obligatorio y
  `cicloFormativo` como campo opcional. La normalizacion contra catalogos queda
  para una issue posterior.
- La revision final de empresas y ofertas corresponde inicialmente a
  `COORDINADOR` y `ADMIN`. `TUTOR_CENTRO` puede consultar y supervisar, pero no
  publica ni rechaza en este contrato minimo.
- Todos los endpoints futuros bajo `/api/**` requieren JWT salvo que una issue
  posterior decida publicar algun listado anonimo.

## Modelo `Empresa`

Representa una empresa colaboradora que puede ofrecer plazas de FCT.

| Campo | Tipo API | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `id` | `number` | respuesta | Identificador tecnico. En backend se modelara como `Long`. |
| `nombre` | `string` | si | Nombre comercial o razon social visible. |
| `tipoIdentificadorFiscal` | `IdentificadorFiscalTipo` | si | Tipo de identificador fiscal: `CIF`, `NIF`, `NIE` u `OTRO`. |
| `identificadorFiscal` | `string` | si | Identificador fiscal normalizado para busqueda y unicidad. |
| `sector` | `string` | si | Sector o actividad principal. Puede convertirse en catalogo mas adelante. |
| `descripcion` | `string` | no | Descripcion breve de la empresa y su actividad. |
| `direccion` | `string` | si | Direccion principal de contacto o centro de trabajo. |
| `localidad` | `string` | si | Localidad principal. |
| `provincia` | `string` | si | Provincia principal. |
| `codigoPostal` | `string` | si | Codigo postal espanol de 5 digitos. |
| `emailContacto` | `string` | si | Email operativo para comunicaciones FCT. |
| `telefonoContacto` | `string` | no | Telefono operativo de contacto. |
| `personaContacto` | `string` | si | Persona principal de contacto para el centro educativo. |
| `estado` | `EmpresaEstado` | respuesta | Estado de validacion y disponibilidad. |
| `createdAt` | `string` | respuesta | Fecha de creacion en formato ISO-8601. |
| `updatedAt` | `string` | respuesta | Fecha de ultima actualizacion en formato ISO-8601. |

### Enums de empresa

```ts
type IdentificadorFiscalTipo = 'CIF' | 'NIF' | 'NIE' | 'OTRO';

type EmpresaEstado =
  | 'PENDIENTE_VALIDACION'
  | 'ACTIVA'
  | 'INACTIVA'
  | 'RECHAZADA';
```

### Estados de empresa

| Estado | Significado | Transiciones principales |
| --- | --- | --- |
| `PENDIENTE_VALIDACION` | Empresa creada o solicitada, pendiente de revision por el centro. | Puede pasar a `ACTIVA` o `RECHAZADA`. |
| `ACTIVA` | Empresa validada y disponible para gestionar ofertas. | Puede pasar a `INACTIVA`. |
| `INACTIVA` | Empresa validada pero temporalmente fuera del flujo operativo. | Puede volver a `ACTIVA` o pasar a `RECHAZADA` si procede. |
| `RECHAZADA` | Empresa descartada por el centro. | Puede volver a `PENDIENTE_VALIDACION` si se reabre la revision. |

## Modelo `OfertaFct`

Representa una oferta de practicas asociada a una empresa colaboradora.

| Campo | Tipo API | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `id` | `number` | respuesta | Identificador tecnico. En backend se modelara como `Long`. |
| `empresaId` | `number` | si | Empresa propietaria de la oferta. |
| `empresaNombre` | `string` | respuesta en listados | Nombre de empresa para evitar consultas adicionales en listados. |
| `titulo` | `string` | si | Titulo visible de la oferta. |
| `descripcion` | `string` | si | Descripcion general de la estancia FCT. |
| `familiaProfesional` | `string` | si | Familia profesional objetivo. |
| `cicloFormativo` | `string` | no | Ciclo formativo recomendado o concreto. |
| `localidad` | `string` | si | Localidad donde se desarrolla la estancia. |
| `provincia` | `string` | si | Provincia donde se desarrolla la estancia. |
| `modalidad` | `OfertaModalidad` | si | Modalidad principal de trabajo. |
| `fechaInicio` | `string` | si | Fecha prevista de inicio en formato `YYYY-MM-DD`. |
| `fechaFin` | `string` | si | Fecha prevista de fin en formato `YYYY-MM-DD`. |
| `plazas` | `number` | si | Numero de plazas disponibles en la oferta. |
| `requisitos` | `string` | no | Requisitos recomendados para el alumnado. |
| `tareas` | `string` | si | Tareas principales previstas durante la FCT. |
| `estado` | `OfertaEstado` | respuesta | Estado editorial y operativo de la oferta. |
| `createdAt` | `string` | respuesta | Fecha de creacion en formato ISO-8601. |
| `updatedAt` | `string` | respuesta | Fecha de ultima actualizacion en formato ISO-8601. |

### Enums de oferta

```ts
type OfertaModalidad = 'PRESENCIAL' | 'HIBRIDA' | 'REMOTA';

type OfertaEstado =
  | 'BORRADOR'
  | 'PENDIENTE_REVISION'
  | 'PUBLICADA'
  | 'CERRADA'
  | 'RECHAZADA'
  | 'ARCHIVADA';
```

### Estados de oferta

| Estado | Significado | Transiciones principales |
| --- | --- | --- |
| `BORRADOR` | Oferta editable por la empresa o por personal autorizado. No visible para alumnos. | Puede pasar a `PENDIENTE_REVISION`. |
| `PENDIENTE_REVISION` | Oferta enviada al centro para validacion. | Puede pasar a `PUBLICADA` o `RECHAZADA`. |
| `PUBLICADA` | Oferta visible para alumnado autenticado y disponible para futuros flujos de solicitud. | Puede pasar a `CERRADA`. |
| `CERRADA` | Oferta ya no admite nuevas solicitudes o interes. | Puede pasar a `ARCHIVADA`. |
| `RECHAZADA` | Oferta rechazada por el centro. No visible para alumnado. | Puede volver a `BORRADOR` si se permite corregirla. |
| `ARCHIVADA` | Oferta historica fuera de listados operativos por defecto. | Estado final salvo reapertura explicita por `ADMIN`. |

## Relaciones

- Una `Empresa` puede tener cero o muchas `OfertaFct`.
- Una `OfertaFct` pertenece siempre a una unica `Empresa`.
- Una oferta solo puede publicarse si su empresa esta en estado `ACTIVA`.
- Una empresa `INACTIVA` o `RECHAZADA` no puede publicar nuevas ofertas.
- Las solicitudes de alumnado, asignaciones, seguimiento y evaluacion no forman
  parte de este contrato. Se modelaran en issues posteriores.
- La vinculacion entre usuarios con rol `EMPRESA` y empresas colaboradoras queda
  como relacion de autorizacion futura. El contrato asume que el backend podra
  determinar "mi empresa" a partir del usuario autenticado.

## Validaciones minimas

### Validaciones generales

- Normalizar espacios al inicio y final en campos de texto.
- Rechazar cadenas vacias en campos obligatorios.
- Usar fechas y timestamps ISO-8601.
- Devolver errores con la forma actual del backend cuando sea posible:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Hay campos obligatorios o invalidos.",
  "timestamp": "2026-05-04T12:00:00Z"
}
```

### Validaciones de `Empresa`

- `nombre`: obligatorio, maximo 150 caracteres.
- `tipoIdentificadorFiscal`: obligatorio, uno de `CIF`, `NIF`, `NIE`, `OTRO`.
- `identificadorFiscal`: obligatorio, maximo 20 caracteres, unico tras
  normalizacion.
- `sector`: obligatorio, maximo 100 caracteres.
- `descripcion`: opcional, maximo 1000 caracteres.
- `direccion`: obligatoria, maximo 200 caracteres.
- `localidad`: obligatoria, maximo 100 caracteres.
- `provincia`: obligatoria, maximo 100 caracteres.
- `codigoPostal`: obligatorio, patron `^[0-9]{5}$`.
- `emailContacto`: obligatorio, formato email, maximo 254 caracteres.
- `telefonoContacto`: opcional, maximo 30 caracteres.
- `personaContacto`: obligatoria, maximo 150 caracteres.
- `estado`: no debe aceptarse libremente en creacion publica; por defecto sera
  `PENDIENTE_VALIDACION` salvo alta administrativa.

### Validaciones de `OfertaFct`

- `empresaId`: obligatorio y debe referenciar una empresa existente.
- `titulo`: obligatorio, maximo 150 caracteres.
- `descripcion`: obligatoria, maximo 2000 caracteres.
- `familiaProfesional`: obligatoria, maximo 150 caracteres.
- `cicloFormativo`: opcional, maximo 150 caracteres.
- `localidad`: obligatoria, maximo 100 caracteres.
- `provincia`: obligatoria, maximo 100 caracteres.
- `modalidad`: obligatoria, una de `PRESENCIAL`, `HIBRIDA`, `REMOTA`.
- `fechaInicio`: obligatoria.
- `fechaFin`: obligatoria y posterior a `fechaInicio`.
- `plazas`: obligatoria, numero entero mayor o igual a 1.
- `requisitos`: opcional, maximo 2000 caracteres.
- `tareas`: obligatoria, maximo 2000 caracteres.
- `estado`: no debe aceptarse libremente en creacion; por defecto sera
  `BORRADOR`.
- Para publicar, la oferta debe tener empresa `ACTIVA`, fechas validas,
  `plazas >= 1` y campos obligatorios completos.

## Permisos por rol

Todos los permisos se deben validar en backend. El frontend podra ocultar
acciones segun rol, pero no debe ser la fuente de autorizacion.

| Accion | `ALUMNO` | `EMPRESA` | `TUTOR_CENTRO` | `COORDINADOR` | `ADMIN` |
| --- | --- | --- | --- | --- | --- |
| Consultar ofertas publicadas | si | si | si | si | si |
| Consultar ofertas no publicas | no | solo propias | si | si | si |
| Crear empresa | no | solicitud propia | no | si | si |
| Editar empresa | no | solo propia y campos permitidos | no | si | si |
| Activar, inactivar o rechazar empresa | no | no | no | si | si |
| Crear oferta | no | propia | no | si | si |
| Editar oferta en `BORRADOR` | no | propia | no | si | si |
| Enviar oferta a revision | no | propia | no | si | si |
| Publicar o rechazar oferta | no | no | no | si | si |
| Cerrar oferta publicada | no | propia | no | si | si |
| Archivar oferta | no | no | no | si | si |

Notas:

- `ALUMNO` solo consulta ofertas `PUBLICADA` y datos basicos de la empresa
  asociada.
- `EMPRESA` opera sobre su empresa y sus ofertas. El alcance exacto de
  multiusuario por empresa queda para una issue de autorizacion.
- `TUTOR_CENTRO` puede consultar informacion operativa para seguimiento y
  orientacion, pero no decide publicacion en este contrato minimo.
- `COORDINADOR` gestiona el flujo funcional del centro.
- `ADMIN` conserva permisos globales para soporte, configuracion y correccion.

## Endpoints REST futuros

Todos los endpoints usan prefijo `/api` y autenticacion `Authorization: Bearer
<accessToken>`.

### Empresas

| Metodo | Endpoint | Roles | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/api/empresas` | `TUTOR_CENTRO`, `COORDINADOR`, `ADMIN` | Lista empresas con filtros y paginacion. |
| `POST` | `/api/empresas` | `EMPRESA`, `COORDINADOR`, `ADMIN` | Crea una empresa o solicitud de empresa. |
| `GET` | `/api/empresas/{id}` | `EMPRESA` propia, `TUTOR_CENTRO`, `COORDINADOR`, `ADMIN` | Obtiene detalle de empresa. |
| `PATCH` | `/api/empresas/{id}` | `EMPRESA` propia, `COORDINADOR`, `ADMIN` | Actualiza campos editables. |
| `POST` | `/api/empresas/{id}/activar` | `COORDINADOR`, `ADMIN` | Cambia estado a `ACTIVA`. |
| `POST` | `/api/empresas/{id}/inactivar` | `COORDINADOR`, `ADMIN` | Cambia estado a `INACTIVA`. |
| `POST` | `/api/empresas/{id}/rechazar` | `COORDINADOR`, `ADMIN` | Cambia estado a `RECHAZADA`. |

### Ofertas

| Metodo | Endpoint | Roles | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/api/ofertas` | todos los roles autenticados | Lista ofertas segun visibilidad del rol. |
| `POST` | `/api/ofertas` | `EMPRESA`, `COORDINADOR`, `ADMIN` | Crea una oferta en `BORRADOR`. |
| `GET` | `/api/ofertas/{id}` | segun visibilidad | Obtiene detalle de oferta. |
| `PATCH` | `/api/ofertas/{id}` | `EMPRESA` propia, `COORDINADOR`, `ADMIN` | Actualiza oferta editable. |
| `POST` | `/api/ofertas/{id}/enviar-revision` | `EMPRESA`, `COORDINADOR`, `ADMIN` | Pasa de `BORRADOR` a `PENDIENTE_REVISION`. |
| `POST` | `/api/ofertas/{id}/publicar` | `COORDINADOR`, `ADMIN` | Pasa de `PENDIENTE_REVISION` a `PUBLICADA`. |
| `POST` | `/api/ofertas/{id}/rechazar` | `COORDINADOR`, `ADMIN` | Pasa a `RECHAZADA`. |
| `POST` | `/api/ofertas/{id}/cerrar` | `EMPRESA` propia, `COORDINADOR`, `ADMIN` | Pasa de `PUBLICADA` a `CERRADA`. |
| `POST` | `/api/ofertas/{id}/archivar` | `COORDINADOR`, `ADMIN` | Pasa a `ARCHIVADA`. |

## Filtros, ordenacion y paginacion

### Parametros comunes

- `page`: numero de pagina basado en cero. Valor por defecto: `0`.
- `size`: tamano de pagina. Valor por defecto: `20`; maximo recomendado: `100`.
- `sort`: campo y direccion, por ejemplo `createdAt,desc`.
- `q`: busqueda textual simple.

### Filtros de empresas

- `estado`: uno de `PENDIENTE_VALIDACION`, `ACTIVA`, `INACTIVA`, `RECHAZADA`.
- `sector`: texto exacto o normalizado.
- `provincia`: provincia.
- `localidad`: localidad.

### Filtros de ofertas

- `estado`: uno de los estados de `OfertaEstado`.
- `empresaId`: identificador de empresa.
- `familiaProfesional`: familia profesional.
- `cicloFormativo`: ciclo formativo.
- `modalidad`: `PRESENCIAL`, `HIBRIDA` o `REMOTA`.
- `provincia`: provincia.
- `localidad`: localidad.
- `fechaInicioDesde`: fecha minima de inicio.
- `fechaInicioHasta`: fecha maxima de inicio.

### Forma de respuesta paginada

```json
{
  "items": [],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0
  }
}
```

## Ejemplos JSON

### Crear empresa

`POST /api/empresas`

```json
{
  "nombre": "Tech Norte Formacion",
  "tipoIdentificadorFiscal": "CIF",
  "identificadorFiscal": "B12345678",
  "sector": "Desarrollo de software",
  "descripcion": "Empresa colaboradora especializada en aplicaciones web.",
  "direccion": "Calle Mayor 12",
  "localidad": "Valencia",
  "provincia": "Valencia",
  "codigoPostal": "46001",
  "emailContacto": "fct@technorte.example",
  "telefonoContacto": "960000000",
  "personaContacto": "Laura Garcia"
}
```

Respuesta esperada:

```json
{
  "id": 15,
  "nombre": "Tech Norte Formacion",
  "tipoIdentificadorFiscal": "CIF",
  "identificadorFiscal": "B12345678",
  "sector": "Desarrollo de software",
  "descripcion": "Empresa colaboradora especializada en aplicaciones web.",
  "direccion": "Calle Mayor 12",
  "localidad": "Valencia",
  "provincia": "Valencia",
  "codigoPostal": "46001",
  "emailContacto": "fct@technorte.example",
  "telefonoContacto": "960000000",
  "personaContacto": "Laura Garcia",
  "estado": "PENDIENTE_VALIDACION",
  "createdAt": "2026-05-04T12:00:00Z",
  "updatedAt": "2026-05-04T12:00:00Z"
}
```

### Crear oferta

`POST /api/ofertas`

```json
{
  "empresaId": 15,
  "titulo": "Practicas de desarrollo web",
  "descripcion": "Apoyo al equipo de desarrollo en mantenimiento de aplicaciones internas.",
  "familiaProfesional": "Informatica y comunicaciones",
  "cicloFormativo": "Desarrollo de Aplicaciones Web",
  "localidad": "Valencia",
  "provincia": "Valencia",
  "modalidad": "PRESENCIAL",
  "fechaInicio": "2026-09-15",
  "fechaFin": "2026-12-15",
  "plazas": 2,
  "requisitos": "Conocimientos basicos de HTML, CSS, TypeScript y Git.",
  "tareas": "Maquetacion, pruebas funcionales, soporte a incidencias y documentacion tecnica."
}
```

Respuesta esperada:

```json
{
  "id": 34,
  "empresaId": 15,
  "empresaNombre": "Tech Norte Formacion",
  "titulo": "Practicas de desarrollo web",
  "descripcion": "Apoyo al equipo de desarrollo en mantenimiento de aplicaciones internas.",
  "familiaProfesional": "Informatica y comunicaciones",
  "cicloFormativo": "Desarrollo de Aplicaciones Web",
  "localidad": "Valencia",
  "provincia": "Valencia",
  "modalidad": "PRESENCIAL",
  "fechaInicio": "2026-09-15",
  "fechaFin": "2026-12-15",
  "plazas": 2,
  "requisitos": "Conocimientos basicos de HTML, CSS, TypeScript y Git.",
  "tareas": "Maquetacion, pruebas funcionales, soporte a incidencias y documentacion tecnica.",
  "estado": "BORRADOR",
  "createdAt": "2026-05-04T12:15:00Z",
  "updatedAt": "2026-05-04T12:15:00Z"
}
```

### Listar ofertas publicadas para alumno

`GET /api/ofertas?estado=PUBLICADA&familiaProfesional=Informatica%20y%20comunicaciones&page=0&size=20`

```json
{
  "items": [
    {
      "id": 34,
      "empresaId": 15,
      "empresaNombre": "Tech Norte Formacion",
      "titulo": "Practicas de desarrollo web",
      "familiaProfesional": "Informatica y comunicaciones",
      "cicloFormativo": "Desarrollo de Aplicaciones Web",
      "localidad": "Valencia",
      "provincia": "Valencia",
      "modalidad": "PRESENCIAL",
      "fechaInicio": "2026-09-15",
      "fechaFin": "2026-12-15",
      "plazas": 2,
      "estado": "PUBLICADA"
    }
  ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

## Pendiente para futuras issues

- Crear entidades JPA, repositorios y migraciones Flyway.
- Implementar controladores, servicios, DTOs y validacion Jakarta.
- Cubrir permisos reales con Spring Security.
- Exponer OpenAPI real de empresas y ofertas.
- Crear modelos TypeScript y servicios Angular.
- Crear pantallas reales de empresas y ofertas.
- Implementar solicitudes de alumnos a ofertas.
- Implementar asignacion, seguimiento, evaluacion y documentacion.

## Preguntas abiertas

- Definir si `sector`, `familiaProfesional` y `cicloFormativo` seran texto libre
  inicialmente o catalogos administrables desde el primer CRUD.
- Definir si una empresa puede tener varios usuarios con rol `EMPRESA` desde la
  primera implementacion o si se asume un unico responsable inicial.
- Definir si el cierre de una oferta por `EMPRESA` debe ser inmediato o pasar por
  aprobacion de `COORDINADOR`.
- Definir si habra visibilidad publica anonima de ofertas o si todo el catalogo
  queda solo para usuarios autenticados.
- Definir si se requiere auditoria de cambios de estado desde el primer backend
  de dominio o si queda para una fase posterior.
