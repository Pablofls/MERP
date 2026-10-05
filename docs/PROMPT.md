# MERP — ERP Personal

Prompt para Claude Code. Este repositorio está vacío (se eliminó un proyecto anterior); empieza desde cero.

## Objetivo

Construir un prototipo de un ERP personal llamado **MERP**, hecho a la medida de un estudiante que también trabaja. Debe funcionar como:

- **App móvil (PWA)**: se instalará en un iPhone desde Safari ("Agregar a pantalla de inicio"), así que necesita manifest, iconos, y comportamiento de app standalone.
- **App de escritorio (web)**: la mayoría de las ediciones se harán desde una laptop, así que la vista desktop debe ser cómoda para capturar y editar rápido, no solo una versión estirada del móvil.

## Stack

- **Next.js + React** (App Router, TypeScript).
- PWA instalable desde Safari iOS (manifest, meta tags de Apple, service worker básico).
- **Fase 1 (este prototipo): SOLO interfaz con datos mock.** No hay base de datos ni persistencia. Todos los datos son mock/hardcodeados. Los botones y formularios deben funcionar (abrir modales, agregar a la lista en memoria, marcar completado, navegar), pero todo vive en estado de React y se pierde al recargar. Ver el plan de fases al final.

## Estructura de la app — 4 secciones

### 1. Home (landing page)

Vista principal al abrir la app. Mezcla lo escolar y lo personal:

- **Arriba — Calendario del día**: vista del horario de HOY (clases + eventos personales) en formato de agenda/timeline. Debe permitir agregar cosas al horario directamente desde aquí.
- **Abajo — Pendientes**: lista de pendientes del día/próximos, mezclando escolares y personales, con opción de marcar como completados y de agregar nuevos.

**Formulario de nuevo pendiente (desde Home):** pregunta primero si es **Escolar** o **Personal**.
- Si es **Escolar** → pide además la **materia** (seleccionada de un catálogo de materias del usuario).
- Si es **Personal** → NO pide materia.
- Campos comunes: título, descripción opcional, fecha límite.

### 2. Escolar

- **Vista del horario semanal completo**: las clases de toda la semana en una cuadrícula tipo calendario semanal, para poder ver fechas de entrega en contexto y planear correctamente.
- Pendientes escolares (con su materia) visibles sobre/junto al horario, idealmente colocados en su fecha de entrega.
- Crear pendiente desde aquí: ya se asume que es escolar, solo pide materia + título + descripción + fecha.
- Gestión del catálogo de **materias** (crear/editar/eliminar) y del **horario de clases** (materia, día, hora inicio/fin, salón opcional).

### 3. Personal

Sección muy similar a Escolar, pero solo con lo personal (incluye pendientes del trabajo):

- Vista semanal de eventos personales.
- Pendientes personales, sin campo de materia.
- Crear pendiente desde aquí: no pregunta materia.

### 4. Hábitos (Habit Tracker)

Tracker propio de hábitos. Cada hábito tiene:

- **Tópico**: qué hábito es (correr, ejercicio, tomar creatina, leer, etc.).
- **Medida/unidad**: qué se registra y en qué unidad (km corridos, minutos de ejercicio, sí/no para la creatina, páginas leídas, etc.).

Funcionalidad:

- Crear hábitos definiendo tópico + unidad de medida (soportar tanto cantidad numérica como simple hecho/no hecho).
- Registrar el valor de cada día ("hoy corrí 5 km", "leí 20 páginas").
- Vista de progreso/historial (racha, calendario de cumplimiento, o gráfica simple por hábito).

## Modelo de datos sugerido (tipos TypeScript + mocks en Fase 1)

- `Materia` (nombre, color).
- `ClaseHorario` (materia, día de la semana, hora inicio, hora fin, recurrente semanal).
- `Evento` (título, fecha/hora inicio y fin, tipo: escolar | personal).
- `Pendiente` (título, descripción, fecha límite, completado, tipo: escolar | personal, materia solo si es escolar).
- `Habito` (tópico, tipo de medida: numérica | booleana, unidad).
- `RegistroHabito` (hábito, fecha, valor).

En Fase 1 estos modelos son solo tipos TypeScript con datos mock realistas (materias de ejemplo, horario de clases de ejemplo, pendientes y hábitos de ejemplo). Incluye campos `googleEventId` / `googleTaskId` nullable en Evento y Pendiente desde ahora, para facilitar la Fase 3.

## Requisitos de UX

- Mobile-first: navegación inferior con tabs (Home, Escolar, Personal, Hábitos) en móvil; en desktop, sidebar o navegación superior con layouts más amplios (por ejemplo el horario semanal a pantalla completa).
- Agregar pendientes y eventos debe ser rápido: pocos taps, formularios cortos.
- Diseño limpio y moderno; usa color para distinguir materias y para diferenciar escolar vs personal.
- Todo en español.

## Plan de fases

**Fase 1 (implementar AHORA): prototipo de interfaz.**
Puras pantallas con datos mock. Sin base de datos, sin persistencia, sin APIs externas. Los botones funcionan (crear/editar/completar actualiza el estado en memoria) pero nada se guarda al recargar. El objetivo es validar el diseño y los flujos de las 4 secciones.

**Fase 2 (NO implementar ahora): Supabase + Vercel.**
Reemplazar los mocks con una base de datos en **Supabase** y hostear en **Vercel**. Nota: el proyecto anterior de este repo ya estaba conectado a Supabase y Vercel (existen `.env.local` / `.env.example` con esa configuración). Para facilitar esta fase, en Fase 1 centraliza el acceso a datos en una capa de servicio/hooks (p. ej. `useEventos()`, `usePendientes()`) para que cambiar mocks por Supabase no requiera tocar la UI.

**Fase 3 (NO implementar ahora): Google Calendar API.**
Integración vía Google Cloud Console (OAuth): los eventos del horario se sincronizarán como eventos de Google Calendar, y los pendientes también se registrarán ahí (como eventos o Google Tasks) para tener registro en el calendario.

## Entregable de la Fase 1

Prototipo corriendo con `npm run dev`: las 4 secciones navegables con datos mock realistas, formularios y botones funcionales (en memoria), responsive móvil/desktop e instalable como PWA en iPhone.
