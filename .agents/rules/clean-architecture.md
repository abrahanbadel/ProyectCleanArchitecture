# Reglas del Proyecto Fintech Core (Clean Architecture + DDD + SRS)

Este proyecto debe cumplir rigurosamente con las reglas definidas en:
- [REGLAS-IA-CleanArchitecture.md](file:///c:/Users/Abraham/OneDrive%20-%20cecar.edu.co/Documentos/DEV_SENIOR_CLASES/Proyecto/REGLAS-IA-CleanArchitecture.md)
- [ESPECIFICACIÓN DE REQUISITOS DEL SISTEMA.md](file:///c:/Users/Abraham/OneDrive%20-%20cecar.edu.co/Documentos/DEV_SENIOR_CLASES/Proyecto/ESPECIFICACI%C3%93N%20DE%20REQUISITOS%20DEL%20SISTEMA.md)
- Reglas en [.cursor/rules/](file:///c:/Users/Abraham/OneDrive%20-%20cecar.edu.co/Documentos/DEV_SENIOR_CLASES/Proyecto/.cursor/rules/)

## Principios Obligatorios:
1. **Regla de Dependencia**: Los imports apuntan exclusivamente hacia adentro (`presentation -> use-cases -> domain` e `infrastructure -> domain`). Prohibido importar librerías externas o frameworks en `domain` o `use-cases`.
2. **Dinero y Precisión**: Prohibido el uso de `number` o `.toNumber()` para saldos y cálculos financieros. Usar siempre `Decimal` (`decimal.js` / `Prisma.Decimal`).
3. **Validación e Invariantes**: Las reglas de negocio residen en las entidades de dominio (Factory `create()` y métodos mutadores de negocio), no duplicadas en casos de uso ni controladores.
4. **TypeScript Estricto**: Cero uso de `any`, `!` o `as` injustificados.
5. **Atomicidad y Concurrencia**: Transacciones con bloqueo/concurrencia segura (`$transaction`, `FOR UPDATE` determinista, `CHECK (balance >= 0)`).
6. **Formato de Respuesta**: Resumen (2-3 líneas), ruta del archivo, código completo y compilable, advertencia de pendientes con `[PENDIENTE]` y comandos de verificación (`pnpm typecheck`, `pnpm test`, etc.).
