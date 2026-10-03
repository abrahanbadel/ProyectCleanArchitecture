# Tareas del curso: Full Stack Software Architecture (Fintech Core App)

## TEMA 1: Principios de Clean Architecture y Diseño de Dominio

### Tareas explícitas (Homework)

- [ ] **1.1 Estudio activo** de la clase abstracta `Transaction` y del polimorfismo (entender cómo separa responsabilidades). _Hecha si:_ puedes explicar sin mirar por qué `Deposit`, `Withdrawal` y `Transfer` extienden `Transaction` y qué principio SOLID aplica (OCP).
- [ ] **1.2 Commit descriptivo**, por ejemplo: `feat: implement rich domain model entities and transaction hierarchy`. _Hecha si:_ `git log` muestra el commit.
- [ ] **1.3 Subir los cambios a la rama `step-01-domain`** en tu repositorio de GitHub. _Hecha si:_ la rama aparece en GitHub.

### Tareas implícitas (el código del laboratorio que debes tener construido)

- [ ] **1.4 Proyecto configurado**: `pnpm init`, TypeScript, `decimal.js`, `tsconfig.json` estricto (`strict`, `noImplicitAny`, `strictNullChecks`, `strictPropertyInitialization`) y carpetas `src/{domain,use-cases,infrastructure,presentation}`. _Hecha si:_ `pnpm exec tsc --noEmit` corre sin errores.
- [ ] **1.5 Capa de dominio completa**: `DomainError`, `InvalidPropValueError`, `FinancialError.ts` (`InsufficientBalanceError`, `AccountFrozenError`, `InvalidAmountError`), entidades `User`, `Account`, `Transaction` (+ `Deposit`, `Withdrawal`, `Transfer`) e interfaces en `Repositories.ts`.
- [ ] **1.6 Corregir los errores del material para que compile** (el código de la clase no compila tal cual):
  - `Account.create`: `props.createAt` debe ser `props.createdAt`.
  - `Deposit`: `props.destinationId` debe ser `props.destinationAccountId`.
  - `Repositories.ts`: `export interface 0` debe ser `export interface TransactionRepository`.
  - `User.ts`: falta importar `InvalidPropValueError`.
  - `Transaction.ts`: falta importar `InvalidPropValueError`, y `validateAmount` recibe `props` pero se declara estático en la clase base.
  - `Account.withdraw`: `this.id` es `string | undefined` y se pasa a errores que esperan `string`.
  - _Hecha si:_ `tsc --noEmit` pasa y ningún archivo de `domain/` importa Express, Prisma ni librerías de infraestructura.

---

## TEMA 2: Persistencia Relacional con PostgreSQL y Prisma ORM

**Rama:** `step-02-prisma`

### Tareas explícitas

- [ ] **2.1 Crear `UserMapper.ts`** basado en `AccountMapper`, con `toDomain()` y `toPersistence()` y retorno tipado `Prisma.UserUncheckedCreateInput`. _Hecha si:_ compila sin `any` y convierte `User` ⇄ registro Prisma.
- [ ] **2.2 Implementar `PrismaUserRepository`** (`findById`, `findByEmail`, `save`) usando `UserMapper` e inyectando `PrismaClient` por constructor.
- [ ] **2.3 Implementar `PrismaTransactionRepository`** usando `TransactionMapper`, con métodos para **guardar transacciones** y **listar el historial de una cuenta** (`findByAccountId`, `findById`, `save`). _Hecha si:_ el historial devuelve entidades de dominio (`Deposit`/`Withdrawal`/`Transfer`), no modelos Prisma.
- [ ] **2.4 Commit semántico** `feat: implement prisma infrastructure with STI and strictly typed mappers` y push a **`step-02-prisma`**.

### Tareas implícitas (laboratorio que debes tener hecho)

- [ ] **2.5 Base de datos PostgreSQL levantada** (Docker Compose, Paso 0 opcional) y Prisma configurado (Paso 1). _Hecha si:_ puedes conectarte a la BD desde Prisma.
- [ ] **2.6 `schema.prisma` con las tablas `User`, `Account` y `Transaction` (STI con columna `type`)** y migración inicial aplicada con `prisma migrate`. _Hecha si:_ existe la carpeta `prisma/migrations/` y las tablas están en la BD.
- [ ] **2.7 `AccountMapper`, `TransactionMapper` y `PrismaAccountRepository`** construidos en clase. Revisa dos puntos del material: el mapper usa `prismaTx.amount.toNumber()` (rompe la regla de Decimal; usa `new Decimal(prismaTx.amount.toString())`) y la interfaz declara `save(): Promise<void>` mientras la implementación retorna `Promise<Account>` (alinéalas).

---

## TEMA 3: Casos de Uso Financieros y Transacciones Atómicas

**Rama:** `step-03-usecases`

### Tareas explícitas

**Casos de uso vistos en clase**

- [ ] **3.1** `CreateAccountUseCase`.
- [ ] **3.2** `GetBalanceUseCase`.
- [ ] **3.3** `TransferMoneyUseCase`.
- [ ] **3.4** `PrismaAccountRepository` con `prisma.$transaction` (método `executeTransaction`).

**Reto práctico independiente** (basado en RF-3.1 y RF-3.2 del SRS)

- [ ] **3.5** `DepositUseCase`: recibe `accountId` y `amount`, valida el estado de la cuenta y aplica el crédito.
- [ ] **3.6** `WithdrawalUseCase`: recibe `accountId` y `amount`, valida saldo suficiente (B ≥ monto) y cuenta activa.
- [ ] **3.7** `FreezeAccountUseCase`: recibe `accountId`, valida que no esté congelada y cambia a `FROZEN`.
- [ ] **3.8** `UnfreezeAccountUseCase`: recibe `accountId`, valida que esté congelada y cambia a `ACTIVE`.

**Pruebas unitarias con Vitest** (carpeta `tests/use-cases/`)

- [ ] **3.9** `CreateAccountUseCase.test.ts`, mínimo **3** escenarios: creación exitosa con balance, sin balance, monto negativo.
- [ ] **3.10** `GetBalanceUseCase.test.ts`, mínimo **2** escenarios: cuenta existe, cuenta no existe.
- [ ] **3.11** `DepositUseCase.test.ts`, mínimo **4** escenarios: depósito exitoso, monto negativo, cuenta no existe, cuenta congelada.
- [ ] **3.12** `WithdrawalUseCase.test.ts`, mínimo **3** escenarios: retiro exitoso, saldo insuficiente, cuenta congelada.
- [ ] **3.13** `FreezeAccountUseCase.test.ts`, mínimo **2** escenarios: congelar cuenta activa, congelar cuenta ya congelada.
- [ ] **3.14** `UnfreezeAccountUseCase.test.ts`, mínimo **2** escenarios: descongelar cuenta congelada, descongelar cuenta activa.

**Control de versiones**

- [ ] **3.15** `git commit` y publicar la rama **`step-03-usecases`** en GitHub.

### Tareas implícitas

- [ ] **3.16 Entorno de pruebas**: instalar Vitest, crear `vitest.config.mjs` y scripts `test` / `test:coverage` en `package.json`. También `TransferMoneyUseCase.test.ts` (4 escenarios mostrados en clase: transferencia exitosa, monto ≤ 0, saldo insuficiente, cuenta congelada). _Hecha si:_ `pnpm test` ejecuta y pasa.
- [ ] **3.17 Excepciones y contratos que el material no define pero los tests de Freeze/Unfreeze necesitan**: la prueba "congelar cuenta ya congelada" y "descongelar cuenta activa" requieren errores de dominio específicos. Crea, por ejemplo, `AccountAlreadyFrozenError` y `AccountNotFrozenError` (heredan de `DomainError`). Añade también `AccountNotFoundError` y el método `executeTransaction` a la interfaz `AccountRepository`. Decide cómo persistir el cambio de estado (el repositorio tiene `save`/`update`).
- [ ] **3.18 Corregir `TransferMoneyUseCase` del material**: no importa `Transfer`; la entidad ya valida congelamiento y saldo, así que no dupliques esas reglas en el caso de uso (llama a `sourceAccount.withdraw()`); `executeTransaction` no debe usar `.toNumber()`; y ten en cuenta que la validación de saldo fuera de la transacción deja una race condition (ver `REGLAS-IA-CleanArchitecture.md`, sección 5.3).

---

## TEMA 4: API REST, Autenticación y Seguridad

**Rama:** `step-04-api`

### Tareas explícitas (Entregables)

- [ ] **4.1 API REST operativa** (Node + TypeScript) con rutas en `/api/auth/*`, `/api/accounts/*` y `/api/transactions/*`. Incluye estos cinco endpoints pedidos como tarea:
  - [ ] **4.1.a** `GET /api/accounts/:accountId/balance`: balance actual.
  - [ ] **4.1.b** `PATCH /api/accounts/:accountId/freeze`: congela la cuenta.
  - [ ] **4.1.c** `PATCH /api/accounts/:accountId/unfreeze`: descongela la cuenta.
  - [ ] **4.1.d** `POST /api/transactions/deposit`: depósito.
  - [ ] **4.1.e** `POST /api/transactions/withdrawal`: retiro.
- [ ] **4.2 Pruebas unitarias y de integración** para los casos de uso y los repositorios. _Hecha si:_ existen pruebas de integración de repositorios (con BD real o contenedor de prueba), además de las unitarias del Tema 3.
- [ ] **4.3 Control de versiones**: commit y publicar la rama **`step-04-api`**.
- [ ] **4.4 Colección Postman / Insomnia** exportada en `.json`, con peticiones organizadas en carpetas por módulo (Auth, Accounts, Transactions).

### Tareas implícitas

- [ ] **4.5 Dependencias y servicios de seguridad**: instalar dependencias (express, cors, zod, bcrypt, jsonwebtoken y sus tipos), `PasswordHasher`/`BcryptPasswordHasher` (costo 10) y `TokenService`/`JwtTokenService` (vigencia 8 h).
- [ ] **4.6 Capa de presentación**: esquemas Zod (`AuthDTOs`, `TransactionDTOs`), `validateRequest`, `AuthMiddleware`, `AuthController`, `AccountController`, `TransactionController` y `errorHandler` global.
- [ ] **4.7 Casos de uso que `app.ts` importa pero el material no desarrolla**: `RegisterUserUseCase`, `LoginUseCase` y `GetUserAccountsUseCase`. Debes escribirlos tú. Según el SRS:
  - RF-1.1: validar contraseña (mín. 8, una mayúscula, un número), unicidad de email (error `UserAlreadyExistsError` → 409; el SRS dice 400, el material de la API dice 409: decide y sé consistente) y **crear automáticamente una cuenta inicial** al registrar.
  - RF-1.2: login con bcrypt; credenciales inválidas → 401 genérico.
- [ ] **4.8 Registrar en `app.ts` todas las rutas**: el `app.ts` del material solo registra register, login, GET/POST accounts, transfer e historial. Faltan las cinco rutas de la tarea 4.1 (balance, freeze, unfreeze, deposit, withdrawal) aunque los controladores ya reciben esos casos de uso. Además aplica `validateRequest` a deposit y withdrawal.
- [ ] **4.9 Verificación con la guía cURL** (5 pasos con respuestas esperadas): registro (201), login (200 + JWT), consulta de cuentas con token, transferencia atómica (201), transferencia con saldo insuficiente (400). Comprueba que los campos del body (`name`, `email`, `password`) coinciden con tu esquema Zod, y que las rutas de ownership devuelven 403 cuando la cuenta no es del usuario.

---

## TEMA 5: Clean Architecture en el Frontend e Integración con React

**Sin rama indicada** (sugerencia: `step-05-frontend`). El backend debe estar funcionando porque es la fuente de verdad del frontend.

### Tareas explícitas: práctica asistida por IA (Cursor Agent, ejecutar en orden)

- [ ] **5.1 Prompt 1 (obligatorio)**: analizar el backend y generar `docs/frontend/` con `backend-contract.md`, `frontend-architecture.md`, `frontend-state.md`, `frontend-workflows.md` y `frontend-validation.md`. Marcar `[PENDIENTE]` lo no comprobable y documentar casos de uso extra descubiertos.
- [ ] **5.2 Prompt 2 (obligatorio)**: crear las personalizaciones de Cursor con front-matter válido: 3 reglas en `.cursor/rules/`, 3 comandos en `.cursor/commands/` y 2 skills en `.cursor/skills/` (o su equivalente en comandos si no hay soporte de skills).
- [ ] **5.3 Prompt 3**: crear o confirmar el esqueleto (scaffold) React + TypeScript con las capas `domain / application / infrastructure / presentation`.
- [ ] **5.4 Prompt 4**: módulo **Auth** (registro, login, logout, restauración de sesión, rutas protegidas con `AuthGuard`).
- [ ] **5.5 Prompt 5**: módulo **Account** (crear cuenta, dashboard, consultar saldo, congelar y descongelar, estados `loading/error/empty/success`).
- [ ] **5.6 Prompt 6**: módulo **Transaction** (depósito, retiro, transferencia, historial; botón bloqueado durante el envío; refresco tras 201, sin actualización optimista).
- [ ] **5.7 Prompt 7**: auditoría de arquitectura y validación del resultado.
- [ ] **5.8 Revisión del estudiante** de cada bloque generado (diff, cumplimiento de dependencias, contratos reales, nada inventado). _Hecha si:_ revisaste cada diff antes de pasar al siguiente prompt.
- [ ] **5.9 Validaciones ejecutadas**: `typecheck`, `lint`, tests y `build` de los módulos Auth, Account y Transaction (o documentar por qué no están disponibles).
- [ ] **5.10 Informe final de auditoría arquitectónica** y reporte de bloqueos y riesgos restantes.

### Tareas implícitas

- [ ] **5.11 Casos de uso adicionales descubiertos en el backend**: si el Prompt 1 detecta operaciones fuera de la lista (perfil, paginación, etc.), deben implementarse o reportarse como bloqueo. Con la API del Tema 4, probablemente aplica a `balance` por cuenta y al historial por cuenta.
- [ ] **5.12 Definition of Done del Tema 5** (13 puntos): puedes explicar por qué existe cada capa; dependencias en la dirección correcta; ningún componente hace HTTP directo; sesión separada del estado de cuentas e historial; Auth, Account y Transaction completos; sin saldo optimista; errores y vacíos claros; contratos verificados contra `backend-contract.md`; reglas del agente con alcance limitado; typecheck, lint, tests y build ejecutados; bloqueos reportados.

---

## TEMA 6: Despliegue en Docker y en la Nube

**Sin rama indicada.** Estructura del repositorio esperada: `backend/`, `frontend/` y `docker-compose.yml` (el material también usa una carpeta `fintech-infra/`).

### Tareas explícitas: entregable final

**Contenerización**

- [ ] **6.1 `backend/Dockerfile` multi-etapa** (builder + runner, `pnpm install --frozen-lockfile`, genera el cliente Prisma, compila a `/dist`, arranque con `prisma migrate deploy`).
- [ ] **6.2 `frontend/Dockerfile` multi-etapa** (build con Vite + Nginx) con `nginx.conf` que soporte React Router (SPA fallback).
- [ ] **6.3 `docker-compose.yml`** que orqueste PostgreSQL 18, backend y frontend con **healthchecks** y **volumen persistente**. _Hecha si:_ `docker compose up` levanta todo y la app funciona en local.

**Despliegue en la nube** (Render, Railway o Fly.io, o ambiente local con Compose)

- [ ] **6.4 Base de datos relacional operativa** con migraciones aplicadas.
- [ ] **6.5 API backend desplegada** y conectada a la BD de producción (variables `DATABASE_URL` y `JWT_SECRET` inyectadas por el panel).
- [ ] **6.6 Frontend en producción** consumiendo la API (variable de build `VITE_API_URL`).

**Entrega a la plataforma académica**

- [ ] **6.7 Enviar cuatro cosas**: enlace al/los repositorio(s) de GitHub (público o con acceso al instructor); URL pública del frontend; URL base o health check del backend; y **video de 5 minutos** mostrando creación de usuario, inicio de sesión y las distintas transacciones financieras.

### Tareas implícitas

- [ ] **6.8 Archivos de soporte**: `.dockerignore` (backend y frontend), `pnpm-workspace.yaml`, `.gitignore` y `.env` local. _Hecha si:_ `git status` no muestra ningún `.env`.
- [ ] **6.9 CORS restringido** al dominio del frontend con `CLIENT_ORIGIN` (el material lo ubica en el servidor Express del backend), sin secretos en variables `VITE_*`.
- [ ] **6.10 Variante permitida**: el material admite crear una aplicación nueva que aplique los mismos principios (Clean Architecture en front y back, contenerización, despliegue). Solo decide esta opción si no usarás el Fintech Core App.

---

## CIERRE: Definition of Done global del SRS (sección 6)

- [ ] **D1. Clean Code y tipado**: cero uso de `any` en TypeScript (backend y frontend).
- [ ] **D2. Manejo de errores**: errores de negocio como excepciones de dominio personalizadas (`InsufficientBalanceError`, `AccountNotFoundError`…).
- [ ] **D3. Persistencia**: toda modificación de datos financieros se guarda en PostgreSQL vía Prisma.
- [ ] **D4. Integración end-to-end**: lo que haces en la interfaz React se refleja en la base de datos y se ve al refrescar.

---

## Orden recomendado para atacar lo pendiente

1. Módulo 0 completo (sin esto nada corre).
2. Temas 1 → 2 → 3 → 4 en orden: cada rama depende del código de la anterior.
3. Dentro del Tema 4, primero los casos de uso de usuario (4.7) y las rutas faltantes (4.8); después Postman y pruebas.
4. Tema 5 solo cuando el backend responda bien a la guía cURL, porque el frontend se genera a partir del código real del backend.
5. Tema 6 al final: contenerizar, probar en local con Compose y luego desplegar y grabar el video.
