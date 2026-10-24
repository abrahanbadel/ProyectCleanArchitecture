# Fintech Core — Clean Architecture

Aplicación web financiera construida con **Clean Architecture**, que permite gestionar usuarios, cuentas bancarias y transacciones de forma segura. El proyecto incluye una API REST en Node.js/TypeScript, un cliente React y PostgreSQL como base de datos.

## Aplicación en producción

| Recurso | Enlace |
| --- | --- |
| Frontend | https://proyectcleanarchitecture-frontend.onrender.com |
| API backend | https://proyectcleanarchitecture.onrender.com |
| Estado de la API | https://proyectcleanarchitecture.onrender.com/health |

La base de datos de producción está alojada en **Neon PostgreSQL**.

## Funcionalidades

- Registro e inicio de sesión de usuarios con JWT.
- Creación y consulta de cuentas bancarias.
- Consulta de saldo.
- Depósitos y retiros.
- Transferencias entre cuentas.
- Historial de movimientos.
- Congelación y reactivación de cuentas.
- Validación de solicitudes y manejo centralizado de errores.

## Arquitectura

El proyecto emplea Clean Architecture para separar el dominio, los casos de uso, la infraestructura y la presentación.

```text
fintech-core-app/
├── src/domain/          # Entidades, reglas de negocio y contratos
├── src/use-cases/       # Casos de uso de la aplicación
├── src/infrastructure/  # Prisma, repositorios, servicios y mapeadores
└── src/presentation/    # Express, controladores y middlewares

fintech-core-front/
├── src/domain/          # Entidades y contratos del cliente
├── src/application/     # Casos de uso
├── src/infrastructure/  # Cliente HTTP y repositorios
└── src/presentation/    # Componentes, páginas, rutas y contexto React
```

## Tecnologías

- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL, Zod, JWT y bcrypt.
- **Frontend:** React, TypeScript, Vite, React Router, Axios y Zod.
- **Infraestructura:** Docker, Docker Compose, Nginx y PostgreSQL 18.
- **Despliegue:** Render para frontend y backend; Neon para la base de datos.
- **Pruebas:** Vitest y Testing Library.

## Ejecutar el proyecto con Docker

### Requisitos

- Docker Desktop con Docker Compose.
- Git.

## Contenedores

- `fintech-core-app/Dockerfile`: imagen multi-etapa para la API; ejecuta `prisma migrate deploy` al iniciar.
- `fintech-core-front/Dockerfile`: compila React y sirve los archivos mediante Nginx.
- `fintech-core-front/nginx.conf`: configura el soporte para React Router.
- `fintech-infra/docker-compose.yml`: orquesta PostgreSQL, backend y frontend, con volumen persistente y health checks para la base de datos y la API.

## Autor

Abraham Badel
