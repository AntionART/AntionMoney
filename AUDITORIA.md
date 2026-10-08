# Auditoría de Antion

## Bugs y errores de lógica

* **src/utils/finance.ts, línea 29 y 33** (`fechaISO` y `horaISO`)
  * **Gravedad**: Alta
  * **Hallazgo**: `toISOString()` devuelve la fecha/hora en UTC. Al estar en la zona horaria del usuario (ej. Colombia UTC-5), `toISOString()` provocará que fechas u horas pasadas las 19:00 horas (7 PM) se registren como el día siguiente. Dado que esta es una app financiera (App Antion), este comportamiento afecta todos los cálculos de rachas, guardado de transacciones, límites presupuestales, etc.
  * **Solución Propuesta**: Reemplazar `toISOString()` por una implementación basada en `getFullYear()`, `getMonth()`, `getDate()`, `getHours()`, `getMinutes()`, `getSeconds()` que usa la fecha local.

* **src/utils/finance.ts, línea 67** (`sumarMesesISO`)
  * **Gravedad**: Media
  * **Hallazgo**: La función no considera el problema de fin de mes (rollover). Por ejemplo, si se suma 1 mes al "2024-01-31", `new Date(2024, 1, 31)` devolverá "2024-03-02" o similar en lugar del último día de febrero ("2024-02-29"). Esto puede desfasar por completo el cálculo del calendario y proyecciones.
  * **Solución Propuesta**: Después de crear el objeto Date con el nuevo mes, comparar el mes resultante. Si cambia al mes siguiente al esperado (debido a que los días exceden los del mes objetivo), ajustar el día al último día del mes objetivo (`fecha.setDate(0)`).

## Errores de TypeScript
  * **Gravedad**: Baja
  * **Hallazgo**: Al ejecutar `npx tsc --noEmit` el compilador de TypeScript retorna con éxito sin arrojar errores.
  * **Solución Propuesta**: No se requiere ninguna acción dado que ya está sin errores de tipeo.

## Arquitectura y organización de carpetas en src/
  * **Gravedad**: Baja
  * **Hallazgo**: La estructura es un patrón estándar funcional (db, navigation, screens, store, theme, types, utils). Se evidencia buena separación de lógica en el manejo de estado (`store`) y funciones utilitarias de negocio independientes de UI (`utils`). Hay demasiadas pantallas sueltas en `screens`.
  * **Solución Propuesta**: Considerar agrupar las `screens` en carpetas por dominios funcionales (ej. `screens/metas`, `screens/deudas`, etc) si sigue escalando.

## Manejo de estado con Zustand y persistencia
  * **Gravedad**: Baja
  * **Hallazgo**: Se hace un uso extensivo de Zustand que carga los datos desde SQLite en funciones asíncronas. Esto significa que el estado base es persistente y Zustand funge más como una caché temporal de aplicación que permite reactividad.
  * **Solución Propuesta**: El patrón es adecuado para aplicaciones Expo SQLite, donde el motor es local y de respuesta rápida.

## Rendimiento
  * **Gravedad**: Baja
  * **Hallazgo**: Las consultas SQLite parecen utilizar correctamente las APIs asíncronas recientes de expo-sqlite (`getAllAsync`, `getFirstAsync`, etc). La base de datos corre con `PRAGMA journal_mode = WAL` (en `migrations.ts`) lo cual es óptimo para SQLite.
  * **Solución Propuesta**: Monitorear re-renders en listas muy largas de transacciones (usar React.memo/FlashList en el futuro).

## Accesibilidad y UX
  * **Gravedad**: Baja
  * **Hallazgo**: Se utilizan componentes puros en UI. No es objeto directo de esta corrección, pero el diseño general puede carecer de configuraciones de accesibilidad (como descripciones de lector de pantallas).
  * **Solución Propuesta**: Asegurar propiedades de accesibilidad (`accessibilityLabel`, `accessibilityRole`) en botones interactivos e iconos.

## Dependencias desactualizadas o innecesarias
  * **Gravedad**: Baja
  * **Hallazgo**: El proyecto fue específicamente degradado del SDK 57 al SDK 54 por razones de cliente Expo Go (`AntionAgents.md`). `package.json` incluye correctamente "expo": "^54.0.0".
  * **Solución Propuesta**: Mantener en Expo SDK 54 según regla estricta de negocio, no actualizar sin justificación en el cliente de prueba.
