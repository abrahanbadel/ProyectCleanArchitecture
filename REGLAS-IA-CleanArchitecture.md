# Reglas para la IA: generación de código (Clean Architecture + DDD, Fintech Core App)

Contexto: sistema financiero con **TypeScript, Node.js, Express, PostgreSQL, Prisma, React**. Estas reglas aplican a TODA respuesta que incluya código. Si una petición del usuario las contradice, advierte el conflicto antes de generar código.

---

## 0. Principios de comportamiento

1. **No inventes** endpoints, DTOs, propiedades, códigos HTTP ni métodos. Si el contrato no está en el código o en el contexto, detente y pregunta.
2. **Trabaja en incrementos pequeños**: primero un plan corto, luego un bloque de código verificable.
3. Indica siempre: qué archivos creas o modificas, en qué capa vive cada uno y qué comandos validan el resultado (`typecheck`, `lint`, `test`, `build`).
4. Si detectas un error en código existente (typo, violación de capas, uso de `number` para dinero), **señálalo** en lugar de copiarlo.
5. Código y comentarios en español; nombres del dominio en el **Lenguaje Ubicuo** del negocio.

---

## 1. Regla de Dependencia (la regla suprema)

Los `import` solo apuntan **hacia adentro**: `presentation → use-cases → domain` y `infrastructure → domain`.

| Capa | Carpeta | Contiene | Prohibido importar |
|---|---|---|---|
| Dominio | `src/domain/` | Entidades, value objects, excepciones, **interfaces (puertos)** | Express, Prisma, bcrypt, jsonwebtoken, Axios, React, `process.env` |
| Aplicación | `src/use-cases/` | Casos de uso, DTOs de entrada/salida | Express, Prisma, bcrypt, jsonwebtoken |
| Infraestructura | `src/infrastructure/` | Repositorios Prisma, mappers, bcrypt, JWT | Controladores, Express |
| Presentación | `src/presentation/` | Rutas, controladores, middlewares, esquemas Zod, `app.ts` | Prisma directo, lógica de negocio |

- Antes de entregar código, **verifica los imports de cada archivo** contra esta tabla.
- Las carpetas no bastan: **los imports son la frontera real**.
- La estructura debe "gritar" el negocio (Screaming Architecture), no el framework.

---

## 2. TypeScript estricto

- `strict: true`, `noImplicitAny`, `strictNullChecks`, `strictPropertyInitialization`.
- **Prohibido `any`**. Para datos desconocidos usa `unknown` y estréchalo con una función de normalización (type guard).
- Tipa explícitamente retornos de funciones públicas, DTOs, puertos y props.
- Usa `readonly` donde corresponda y `private` para estado interno de las entidades.
- No uses aserciones no justificadas (`as X`, `!`) para silenciar al compilador.

---

## 3. Dominio (DDD táctico)

### 3.1 Entidades ricas (no anémicas)
- La entidad contiene **datos y comportamiento**. Prohibido exponer setters públicos de estado crítico.
- Constructor `private` + método estático `create()` (Factory Method) que valida las invariantes.
- Estado interno encapsulado en `props`; solo getters públicos.
- Las mutaciones ocurren mediante métodos de dominio con nombres del negocio: `deposit()`, `withdraw()`, `freeze()`, `unfreeze()`, `markAsCompleted()`. Nunca `setBalance()`.

### 3.2 Invariantes (siempre protegidas por la entidad)
- Saldo `B ≥ 0`; nunca se crea ni queda una cuenta con saldo negativo.
- Cuenta `FROZEN` no puede debitar (retiro ni transferencia saliente). Sí puede recibir créditos y mostrar saldo.
- Monto de cualquier transacción `> 0`.
- Transferencia: cuenta origen ≠ cuenta destino.
- **La regla vive en UN solo lugar: la entidad.** El caso de uso NO repite `if (balance < amount)` ni `if (status === 'FROZEN')`; llama a `account.withdraw()` y deja que la entidad lance la excepción.

### 3.3 Dinero
- **Prohibido `number` para saldos y montos** en dominio, casos de uso e infraestructura. Usa `Decimal` (`decimal.js` / `Prisma.Decimal`).
- Nunca conviertas con `.toNumber()` para operar o persistir. Pasa el `Decimal` directamente.
- `number` solo es aceptable en el borde (DTO JSON de entrada/salida), convertido de inmediato a `Decimal`, o mejor, recibido como `string`.
- Formato monetario (2 decimales) es responsabilidad de presentación.

### 3.4 Transacciones (OCP + LSP)
- `Transaction` es clase abstracta; `Deposit`, `Withdrawal`, `Transfer` la extienden.
- Un nuevo tipo se agrega **extendiendo**, nunca añadiendo ramas `if/else/switch` sobre el tipo en código existente (excepción: el mapper de persistencia, que es el único lugar donde se resuelve el discriminador).
- Las subclases respetan el contrato base (no lanzan errores inesperados que la base no prometa).
- Ciclo de estado: `PENDING → COMPLETED | FAILED`.

### 3.5 Excepciones de dominio
- Todas heredan de `DomainError`. Ejemplos: `InsufficientBalanceError`, `AccountFrozenError`, `AccountNotFoundError`, `InvalidAmountError`, `InvalidPropValueError`, `UserAlreadyExistsError`, `InvalidCredentialsError`.
- Mensajes en lenguaje de negocio. **Sin códigos HTTP** ni conceptos web en el dominio.
- Prohibido `throw new Error("...")` genérico para reglas de negocio.

### 3.6 Puertos (interfaces)
- Los define el dominio: `UserRepository`, `AccountRepository`, `TransactionRepository`, `PasswordHasher`, `TokenService`.
- **ISP**: interfaces pequeñas y cohesivas. Un repositorio no envía correos ni genera PDFs.
- Los métodos de la interfaz y su implementación deben tener **la misma firma** (mismo tipo de retorno).

---

## 4. Casos de uso (capa de aplicación)

- Una clase por caso de uso, con un único método `execute(input: InputDTO): Promise<OutputDTO>`.
- Dependencias recibidas **por constructor** y como **interfaces** (DIP). Nunca `new PrismaClient()` ni `new BcryptPasswordHasher()` dentro.
- Flujo: `validar entrada (fail-fast) → leer vía repositorio → invocar método de la entidad → persistir vía repositorio → devolver OutputDTO`.
- No contienen lógica de dominio propia, no conocen HTTP (`req`, `res`), ni Prisma, ni React.
- Entrada/salida con **DTOs explícitos**; nunca devolver entidades de Prisma ni exponer `passwordHash`.
- Falla rápido: valida precondiciones **antes** de abrir transacciones de base de datos.
- Lanza excepciones de dominio tipadas; no devuelvas strings de error.

---

## 5. Persistencia e infraestructura

### 5.1 Repositorios (adaptadores)
- Implementan la interfaz del dominio y reciben `PrismaClient` por constructor.
- Devuelven **entidades de dominio**, jamás modelos Prisma.
- Toda traducción pasa por **Mappers** (`toDomain` / `toPersistence`). Prohibido construir entidades o registros fuera de ellos.

### 5.2 Herencia: Single Table Inheritance
- Una tabla `Transaction` con columna discriminadora `type` (`DEPOSIT | WITHDRAWAL | TRANSFER`) y `sourceAccountId` / `destinationAccountId` opcionales.
- El mapper valida coherencia (ej. `Deposit` exige `destinationAccountId`) y reconstruye la subclase correcta.

### 5.3 Atomicidad y concurrencia (RNF-2)
- Toda operación que mueva dinero se ejecuta en `prisma.$transaction(async (tx) => ...)` **dentro del repositorio**; el caso de uso solo llama a un método del puerto (ej. `executeTransaction`).
- **`$transaction` por sí solo no previene race conditions.** Debe combinarse con una de estas estrategias (indica cuál usas):
  - Bloqueo pesimista de filas: `SELECT ... FOR UPDATE` (vía `$queryRaw`) sobre las cuentas involucradas, **en orden determinista por id** para evitar deadlocks.
  - Control optimista con campo `version`, rechazando si no coincide.
  - Restricción de BD `CHECK (balance >= 0)` como última defensa.
- La lectura y validación del saldo deben ocurrir **dentro** de la misma transacción que el débito (evitar check-then-act fuera de ella).
- Registro de la transacción + actualización de ambos saldos = una sola unidad atómica.

### 5.4 Prisma / PostgreSQL
- Montos como `Decimal` en el esquema (`@db.Decimal(precision, scale)`). Ids `uuid`.
- Migraciones versionadas con `prisma migrate`. `db push` solo en prototipado local, **nunca en producción**.
- Servicios de seguridad (`bcrypt`, `jsonwebtoken`) viven en infraestructura detrás de puertos del dominio.

---

## 6. Presentación (API REST)

- Nivel 2 de Richardson: recursos con sustantivos (`/api/accounts`, `/api/transactions`) y verbos HTTP correctos.
- Códigos: `200` lectura/login, `201` creación, `400` validación o invariante, `401` sin autenticar o token inválido/vencido, `403` autenticado sin permiso sobre el recurso, `404` recurso inexistente, `409` conflicto (email duplicado), `500` error no controlado.
- **Validación en la frontera con Zod** (middleware `validateRequest`) antes de llegar al caso de uso. Sintaxis aquí, reglas de negocio en el dominio.
- **Tríptico de modelos**: DTO (Zod) ≠ Entidad (dominio) ≠ Modelo Prisma. Nunca reutilices uno como otro. Evita *mass assignment*: mapea campo por campo.
- Controladores delgados: extraen datos de `req`, llaman a UN caso de uso, formatean `res`. Sin reglas de negocio ni Prisma.
- **Autorización a nivel de recurso**: autenticado no basta. Verifica que la cuenta pertenezca al `userId` del token (si no, `403`). Nunca confíes en un `userId` enviado en el body.
- **Middleware global de errores (último en la cadena)**: mapea `DomainError → HTTP` y responde con formato uniforme. Errores desconocidos → `500` genérico, **sin stack trace ni detalles de PostgreSQL**.
- Las transferencias (POST no idempotente) deben considerar una **Idempotency-Key** para evitar duplicados por reintentos.
- Orden de pipeline: `Ruta → validateRequest(Zod) → AuthMiddleware → Controller → UseCase → errorHandler`.
- Composición de dependencias manual en un único lugar (`createApp()`), nunca dispersa.

---

## 7. Seguridad

- Contraseñas con **bcrypt, costo ≥ 10**. Prohibido texto plano, MD5, SHA simples. Nunca se loguean ni se devuelven.
- Política de contraseña: mínimo 8 caracteres, al menos una mayúscula y un número.
- **JWT** (vigencia 8 h): payload mínimo (`userId`, `email`, `exp`). **Nunca** contraseñas, saldos ni datos sensibles (el payload es legible, no cifrado). Secreto desde variable de entorno, jamás hardcodeado.
- Login fallido: `401` con mensaje genérico, sin revelar si falló el email o la clave.
- El middleware de auth valida `Authorization: Bearer <token>`; sin token o firma inválida → `401` antes de tocar la lógica de negocio.
- Consultas siempre parametrizadas (Prisma). Prohibido concatenar strings en SQL; en `$queryRaw` usa plantillas etiquetadas.
- CORS restringido al origen del frontend en producción.

---

## 8. Pruebas

- Casos de uso: **Vitest con repositorios mockeados**, sin base de datos real ni Prisma.
- Cubre mínimo: caso exitoso, cada excepción de dominio posible y bordes (monto 0, negativo, mismo origen/destino, cuenta congelada, saldo exacto).
- Pruebas de entidades: cada invariante tiene su test.
- Prueba comportamiento, no detalles de implementación.
- Dinero en pruebas con `Decimal`, no con `number` flotante.

---

## 9. Frontend (React + TypeScript)

### 9.1 Capas
`domain/` (modelos y puertos) · `application/` (casos de uso) · `infrastructure/` (Axios, storage, adaptadores HTTP) · `presentation/` (componentes, páginas, hooks, router, contexto).

Cadena esperada: `Page → hook → caso de uso → Gateway (puerto) ← adaptador HTTP → apiClient → API`.

### 9.2 Prohibiciones en componentes
- No importar Axios, ni leer/escribir `localStorage`, ni construir headers `Authorization`, ni conocer URLs de endpoints.
- No contener reglas financieras (`balance >= amount` solo como ayuda de UX, jamás como autoridad).
- Los servicios/adaptadores no importan React.

### 9.3 Estado
- **Local**: formularios, modales.
- **Global de sesión**: solo usuario autenticado, inicialización y logout (Context). No meter cuentas ni historial ahí.
- **Remoto**: cuentas, saldo, historial; el backend es la fuente de verdad, con **una sola fuente local** por dato.
- Toda consulta modela explícitamente: `idle | loading | success | empty | error`. `empty` no es `error`. El error ofrece reintento.

### 9.4 Operaciones financieras
- Frontend valida formato y monto positivo; el backend valida saldo, estado, permisos y atomicidad.
- **Sin actualización optimista del saldo**: tras un `201`, se vuelve a consultar saldo e historial.
- Deshabilitar el botón y mostrar *loading* durante el envío (evita doble envío, RNF-4).
- Errores de negocio (saldo insuficiente, cuenta congelada, cuenta inexistente) se muestran como tales, no como "error de red".
- Token encapsulado detrás de un `StorageAdapter`; `AuthGuard` con `Outlet` protege rutas (la autorización real sigue en el backend).
- Errores externos tipados como `unknown` y normalizados. Cero `any` en contratos.

---

## 10. Despliegue y configuración

- **Dockerfile multi-etapa** (`builder` → `runner` con `node:24-alpine` / `nginx:alpine`). Copiar manifiestos y lockfile primero, `pnpm install --frozen-lockfile`, luego el código (aprovechar caché de capas).
- Arranque del backend: verificar BD → `prisma migrate deploy` → lanzar API.
- `docker-compose` con PostgreSQL, volumen persistente, healthchecks y `depends_on: condition: service_healthy`.
- **Twelve-Factor**: configuración por entorno. Backend lee `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` en runtime. Nunca hornear secretos en la imagen.
- Variables `VITE_*` son **públicas** (se incrustan en el build): jamás secretos.
- `.env` en `.gitignore`; secretos de producción solo en el panel del proveedor o GitHub Secrets.

---

## 11. Checklist que la IA debe correr mentalmente antes de responder

- [ ] ¿Algún `import` apunta hacia afuera (dominio/use-cases importando Express, Prisma, bcrypt, JWT)?
- [ ] ¿Hay `any`, `!` o `as` injustificados?
- [ ] ¿Algún monto o saldo usa `number` o `.toNumber()` para operar o persistir?
- [ ] ¿Las reglas de negocio viven en la entidad y no están duplicadas en el caso de uso o el controlador?
- [ ] ¿Las entidades se crean por `create()` y se mutan solo con métodos de dominio?
- [ ] ¿Los errores de negocio son subclases de `DomainError`, sin códigos HTTP en el dominio?
- [ ] ¿El caso de uso depende de interfaces inyectadas por constructor?
- [ ] ¿Todo traspaso entre capas usa DTOs/mappers (no entidades Prisma)?
- [ ] ¿El movimiento de dinero es atómico **y** protegido contra race conditions (lock/versión/CHECK)?
- [ ] ¿Hay validación Zod en la frontera y autorización por recurso (`403`)?
- [ ] ¿El manejador global de errores oculta detalles internos?
- [ ] ¿Las firmas de interfaz e implementación coinciden y todos los imports/nombres existen (sin typos)?
- [ ] ¿Incluí pruebas con mocks para el caso de uso?
- [ ] En frontend: ¿ningún componente usa Axios/`localStorage`, existen los 5 estados y se refresca tras mutar?
- [ ] ¿Algún secreto quedó hardcodeado o en `VITE_*`?

---

## 12. Formato esperado de cada respuesta de código

1. **Resumen en 2-3 líneas** de lo que se va a construir y en qué capa.
2. **Ruta de cada archivo** (`src/domain/entities/Account.ts`) antes de su bloque de código.
3. Código completo y compilable, sin placeholders tipo `// ...` en lógica crítica.
4. **Supuestos y puntos pendientes** marcados como `[PENDIENTE]` cuando falte información.
5. **Cómo verificar**: comandos concretos (`pnpm typecheck`, `pnpm test`, `curl`...).
