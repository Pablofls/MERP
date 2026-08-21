"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTutorial } from "@/lib/context/TutorialContext";

const PASOS = [
  {
    ruta: "/",
    titulo: "¡Bienvenido a MERP!",
    descripcion:
      "Tu ERP personal para organizar tu vida académica, personal y tus hábitos. Te damos un tour rápido para que conozcas todo.",
    icono: "👋",
  },
  {
    ruta: "/",
    titulo: "Inicio — Tu día en un vistazo",
    descripcion:
      "Aquí ves la Agenda del día con tus clases programadas y los Pendientes de hoy de todas las secciones reunidos en un solo lugar.",
    icono: "🏠",
  },
  {
    ruta: "/escolar",
    titulo: "Escolar — Tu vida académica",
    descripcion:
      "Aquí organizas todo lo relacionado con la escuela: materias, clases, horario, fechas importantes y tareas pendientes.",
    icono: "🎓",
  },
  {
    ruta: "/escolar",
    titulo: "Materias y Clases",
    descripcion:
      "Toca 'Configurar' en la esquina superior derecha para crear tus materias con colores y registrar tus clases con día y horario.",
    icono: "📚",
  },
  {
    ruta: "/escolar",
    titulo: "Horario Semanal",
    descripcion:
      "Una vez que registres tus clases, el horario semanal se genera automáticamente organizado por día de la semana.",
    icono: "📅",
  },
  {
    ruta: "/escolar",
    titulo: "Fechas Importantes",
    descripcion:
      "Registra exámenes, entregas y eventos. Las fechas dentro de los próximos 7 días aparecen como pendientes en el Inicio.",
    icono: "⚠️",
  },
  {
    ruta: "/escolar",
    titulo: "Pendientes Escolares",
    descripcion:
      "Agrega tareas por materia con fecha límite. Puedes filtrarlos por materia y ordenarlos de más próximo a más lejano.",
    icono: "✅",
  },
  {
    ruta: "/personal",
    titulo: "Personal — Tus metas propias",
    descripcion:
      "Gestiona pendientes y proyectos personales, completamente separados de lo académico.",
    icono: "⚡",
  },
  {
    ruta: "/personal",
    titulo: "Categorías Personales",
    descripcion:
      "Toca 'Configurar' para crear categorías y organizar tus pendientes como prefieras (ej: Fitness, Lectura, Trabajo).",
    icono: "🏷️",
  },
  {
    ruta: "/personal",
    titulo: "Calendario Semanal",
    descripcion:
      "Navega semana a semana y toca cualquier día para ver los pendientes programados para esa fecha.",
    icono: "🗓️",
  },
  {
    ruta: "/habitos",
    titulo: "Hábitos — Construye rutinas",
    descripcion:
      "Registra y monitorea hábitos diarios o semanales. Construye rachas y visualiza tu constancia en el tiempo.",
    icono: "🔥",
  },
  {
    ruta: "/habitos",
    titulo: "Crear un Hábito",
    descripcion:
      "Toca 'Nuevo' para crear un hábito. Elige si se registra como Sí/No o con cantidad (ej: km corridos, páginas leídas).",
    icono: "📊",
  },
  {
    ruta: "/habitos",
    titulo: "Racha y Progreso",
    descripcion:
      "Cada hábito muestra tu racha actual. El calendario de colores te permite ver qué días completaste cada hábito.",
    icono: "🎯",
  },
  {
    ruta: "/perfil",
    titulo: "Perfil — Google Calendar",
    descripcion:
      "En tu perfil puedes conectar tu cuenta de Google Calendar para mantener todo sincronizado automáticamente.",
    icono: "📆",
  },
  {
    ruta: "/perfil",
    titulo: "¿Qué se sincroniza?",
    descripcion:
      "Al conectar Google Calendar, tus clases y pendientes con fecha límite aparecerán automáticamente en tu calendario de Google.",
    icono: "🔗",
  },
];

export default function Tutorial() {
  const { activo, paso, terminar, siguiente, anterior } = useTutorial();
  const router = useRouter();

  const pasoActual = PASOS[paso];
  const esPrimero = paso === 0;
  const esUltimo = paso === PASOS.length - 1;

  useEffect(() => {
    if (activo && pasoActual) {
      router.push(pasoActual.ruta);
    }
  }, [activo, paso]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activo || !pasoActual) return null;

  function handleSiguiente() {
    if (esUltimo) {
      terminar();
    } else {
      siguiente();
    }
  }

  return (
    <>
      {/* Overlay semitransparente */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={terminar}
        aria-hidden="true"
      />

      {/* Tarjeta del tutorial */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg mx-auto overflow-hidden">
          {/* Barra de progreso */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-blue-900 transition-all duration-300 ease-out"
              style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            {/* Ícono y contador */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl" role="img" aria-hidden="true">
                {pasoActual.icono}
              </span>
              <span className="text-xs text-gray-400 font-medium tabular-nums">
                {paso + 1} / {PASOS.length}
              </span>
            </div>

            {/* Contenido */}
            <h3 className="text-base font-bold text-gray-900 mb-1.5">
              {pasoActual.titulo}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {pasoActual.descripcion}
            </p>

            {/* Botones */}
            <div className="flex items-center gap-2 mt-4">
              {!esPrimero && (
                <button
                  onClick={anterior}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
              )}

              <button
                onClick={terminar}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors ${
                  esPrimero ? "" : "ml-auto"
                }`}
              >
                Saltar
              </button>

              <button
                onClick={handleSiguiente}
                className={`py-2.5 px-5 rounded-xl bg-blue-900 text-white text-sm font-semibold hover:bg-blue-800 transition-colors ${
                  esPrimero ? "flex-1" : ""
                }`}
              >
                {esUltimo ? "¡Listo!" : "Siguiente →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
