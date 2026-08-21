"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTutorial } from "@/lib/context/TutorialContext";

type StepClick = { id: string; delay?: number };

type TutorialStep = {
  ruta: string;
  titulo: string;
  descripcion: string;
  icono: string;
  targetId?: string;
  setupClicks?: StepClick[];
  padding?: number;
};

const PASOS: TutorialStep[] = [
  // 0 — Bienvenida
  {
    ruta: "/",
    titulo: "¡Bienvenido a MERP!",
    descripcion: "Tu ERP personal para organizar tu vida academica, personal y tus habitos. Te damos un tour por cada seccion de la app.",
    icono: "👋",
  },
  // 1 — Agenda del dia
  {
    ruta: "/",
    titulo: "Agenda del dia",
    descripcion: "Aqui ves tus clases del dia y eventos de Google Calendar. Navega entre dias con las flechas izquierda y derecha.",
    icono: "📅",
    targetId: "agenda-section",
  },
  // 2 — Boton crear evento (clic simulado)
  {
    ruta: "/",
    titulo: "Crear un evento",
    descripcion: "Con este boton puedes agregar un evento directamente a tu Google Calendar. Vamos a abrirlo...",
    icono: "➕",
    targetId: "btn-crear-evento",
    setupClicks: [{ id: "btn-crear-evento", delay: 500 }],
  },
  // 3 — Modal crear evento abierto
  {
    ruta: "/",
    titulo: "Formulario de evento",
    descripcion: "Desde aqui capturas titulo, fecha, hora y descripcion del evento. Al guardar, aparece en tu Google Calendar automaticamente.",
    icono: "📋",
    targetId: "modal-content",
    padding: 0,
  },
  // 4 — Cerrar modal y mostrar pendientes
  {
    ruta: "/",
    titulo: "Pendientes de hoy",
    descripcion: "Aqui se reunen todos los pendientes del dia de todas las secciones. Marca los que completes con el circulo de la izquierda.",
    icono: "✅",
    targetId: "pendientes-section",
    setupClicks: [{ id: "modal-close", delay: 0 }],
  },
  // 5 — Abrir modal agregar pendiente
  {
    ruta: "/",
    titulo: "Agregar un pendiente",
    descripcion: "Toca Agregar para crear un nuevo pendiente. Puedes asignarle materia, categoria y fecha limite. Vamos a verlo...",
    icono: "📝",
    targetId: "btn-agregar-pendiente",
    setupClicks: [{ id: "btn-agregar-pendiente", delay: 500 }],
  },
  // 6 — Modal pendiente abierto
  {
    ruta: "/",
    titulo: "Formulario de pendiente",
    descripcion: "Agrega titulo, descripcion, tipo (escolar o personal), materia o categoria, y fecha limite. Asi mantienes todo organizado.",
    icono: "🗒️",
    targetId: "modal-content",
    padding: 0,
  },
  // 7 — Seccion Escolar
  {
    ruta: "/escolar",
    titulo: "Escolar — Tu vida academica",
    descripcion: "Aqui organizas todo lo relacionado con la escuela: materias, clases, horario, fechas importantes y tareas.",
    icono: "🎓",
    setupClicks: [{ id: "modal-close", delay: 0 }],
  },
  // 8 — Abrir configurar escolar
  {
    ruta: "/escolar",
    titulo: "Configurar materias y clases",
    descripcion: "Toca el boton Configurar para gestionar tus materias con colores y registrar tus clases con dia y horario. Vamos...",
    icono: "⚙️",
    targetId: "btn-config-escolar",
    setupClicks: [{ id: "btn-config-escolar", delay: 400 }],
  },
  // 9 — GestorMaterias
  {
    ruta: "/escolar",
    titulo: "Tus materias",
    descripcion: "Crea una materia por cada asignatura. Asignale un color para distinguirla facilmente en el horario y los pendientes.",
    icono: "📚",
    targetId: "gestor-materias",
  },
  // 10 — GestorClases
  {
    ruta: "/escolar",
    titulo: "Tus clases",
    descripcion: "Registra cada clase con dia de la semana, hora de inicio y fin, salon y la materia que le corresponde.",
    icono: "🗓️",
    targetId: "gestor-clases",
  },
  // 11 — Horario semanal
  {
    ruta: "/escolar",
    titulo: "Horario semanal",
    descripcion: "Una vez registradas tus clases, el horario semanal se genera automaticamente organizado por dia.",
    icono: "📆",
    targetId: "horario-section",
  },
  // 12 — Fechas importantes
  {
    ruta: "/escolar",
    titulo: "Fechas importantes",
    descripcion: "Registra examenes, entregas y eventos. Las fechas dentro de los proximos 7 dias aparecen como pendientes en el Inicio.",
    icono: "⚠️",
    targetId: "fechas-section",
  },
  // 13 — Pendientes escolares
  {
    ruta: "/escolar",
    titulo: "Pendientes escolares",
    descripcion: "Agrega tareas por materia con fecha limite. Puedes filtrarlos por materia y ordenarlos de mas proximo a mas lejano.",
    icono: "✅",
    targetId: "pendientes-escolar-section",
  },
  // 14 — Personal
  {
    ruta: "/personal",
    titulo: "Personal — Tus metas propias",
    descripcion: "Gestiona pendientes y proyectos personales, completamente separados de lo academico.",
    icono: "⚡",
  },
  // 15 — Configurar categorias
  {
    ruta: "/personal",
    titulo: "Categorias personales",
    descripcion: "Toca Configurar para crear categorias y organizar tus pendientes (ej: Fitness, Lectura, Trabajo). Veamos...",
    icono: "🏷️",
    targetId: "btn-config-personal",
    setupClicks: [{ id: "btn-config-personal", delay: 400 }],
  },
  // 16 — Gestor categorias
  {
    ruta: "/personal",
    titulo: "Tus categorias",
    descripcion: "Crea las categorias que necesites, cada una con su color. Luego las seleccionas al agregar un pendiente personal.",
    icono: "🎨",
    targetId: "gestor-categorias",
  },
  // 17 — Calendario personal
  {
    ruta: "/personal",
    titulo: "Calendario semanal",
    descripcion: "Navega semana a semana y toca cualquier dia para ver los pendientes programados para esa fecha.",
    icono: "🗓️",
    targetId: "calendario-personal-section",
  },
  // 18 — Habitos
  {
    ruta: "/habitos",
    titulo: "Habitos — Construye rutinas",
    descripcion: "Registra y monitorea habitos diarios o semanales. Construye rachas y visualiza tu constancia en el tiempo.",
    icono: "🔥",
  },
  // 19 — Crear habito
  {
    ruta: "/habitos",
    titulo: "Agregar un habito",
    descripcion: "Toca Nuevo para crear un habito. Elige si se registra como Si/No o con cantidad (ej: km corridos, paginas leidas). Vemos...",
    icono: "📊",
    targetId: "btn-nuevo-habito",
    setupClicks: [{ id: "btn-nuevo-habito", delay: 400 }],
  },
  // 20 — Modal habito abierto
  {
    ruta: "/habitos",
    titulo: "Formulario de habito",
    descripcion: "Define el nombre, tipo de medicion y frecuencia (diaria o semanal). Puedes establecer una meta semanal si lo deseas.",
    icono: "🎯",
    targetId: "modal-content",
    padding: 0,
  },
  // 21 — Perfil / Google Calendar
  {
    ruta: "/perfil",
    titulo: "Perfil — Google Calendar",
    descripcion: "Conecta tu cuenta de Google Calendar para mantener todo sincronizado. Tus clases y pendientes con fecha aparecen ahi automaticamente.",
    icono: "📆",
    targetId: "google-calendar-section",
    setupClicks: [{ id: "modal-close", delay: 0 }],
  },
  // 22 — Fin
  {
    ruta: "/perfil",
    titulo: "¡Listo para empezar!",
    descripcion: "Ya conoces MERP. Te recomendamos comenzar creando tus materias y clases en la seccion Escolar. ¡Suerte!",
    icono: "🚀",
  },
];

function flashElement(id: string) {
  const el = document.querySelector(`[data-tutorial-id="${id}"]`) as HTMLElement | null;
  if (!el) return;
  el.classList.remove("tutorial-click-flash");
  void el.offsetWidth; // reflow para reiniciar animacion
  el.classList.add("tutorial-click-flash");
  setTimeout(() => el.classList.remove("tutorial-click-flash"), 500);
}

function clickTutorialEl(id: string) {
  const el = document.querySelector(`[data-tutorial-id="${id}"]`) as HTMLElement | null;
  if (!el) return;
  flashElement(id);
  el.click();
}

export default function Tutorial() {
  const { activo, paso, terminar, siguiente, anterior } = useTutorial();
  const router = useRouter();

  const pasoActual = PASOS[paso];
  const esPrimero = paso === 0;
  const esUltimo = paso === PASOS.length - 1;

  // Posicion del spotlight
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback((targetId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSpotRect(null);

    pollingRef.current = setInterval(() => {
      const el = document.querySelector(`[data-tutorial-id="${targetId}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setSpotRect(r);
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 120);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setSpotRect(null);
  }, []);

  // Cuando cambia el paso: navegar, ejecutar setupClicks y arrancar el spotlight
  useEffect(() => {
    if (!activo || !pasoActual) return;

    router.push(pasoActual.ruta);

    // Para evitar interferir con modales abiertos del paso anterior, disparamos con un delay
    const timer = setTimeout(() => {
      // Ejecutar setupClicks en secuencia
      const clicks = pasoActual.setupClicks ?? [];
      let accum = 0;
      clicks.forEach((c) => {
        const d = accum + (c.delay ?? 0);
        accum = d + 80;
        setTimeout(() => clickTutorialEl(c.id), d);
      });

      // Arrancar spotlight despues de que los clics abrieron los elementos
      const extraDelay = clicks.length > 0 ? accum + 400 : 0;
      if (pasoActual.targetId) {
        setTimeout(() => startPolling(pasoActual.targetId!), extraDelay);
      } else {
        stopPolling();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      stopPolling();
    };
  }, [activo, paso]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpiar polling al desmontar
  useEffect(() => () => stopPolling(), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activo || !pasoActual) return null;

  const PAD = pasoActual.padding !== undefined ? pasoActual.padding : 14;

  function handleSiguiente() {
    stopPolling();
    if (esUltimo) {
      terminar();
    } else {
      siguiente();
    }
  }

  function handleAnterior() {
    stopPolling();
    anterior();
  }

  function handleSaltar() {
    stopPolling();
    terminar();
  }

  return (
    <>
      {/* SVG overlay con recorte spotlight */}
      <svg
        className="fixed inset-0 pointer-events-none"
        style={{ width: "100vw", height: "100vh", zIndex: 45 }}
        aria-hidden="true"
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotRect && (
              <rect
                x={spotRect.left - PAD}
                y={spotRect.top - PAD}
                width={spotRect.width + PAD * 2}
                height={spotRect.height + PAD * 2}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Borde pulsante alrededor del elemento */}
      {spotRect && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none rounded-xl border-2 border-white animate-pulse"
          style={{
            zIndex: 46,
            left: spotRect.left - PAD,
            top: spotRect.top - PAD,
            width: spotRect.width + PAD * 2,
            height: spotRect.height + PAD * 2,
          }}
        />
      )}

      {/* Tarjeta del tutorial */}
      <div
        className="fixed left-0 right-0 bottom-0 p-4"
        style={{ zIndex: 60, paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg mx-auto overflow-hidden">
          {/* Barra de progreso */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-blue-900 transition-all duration-300 ease-out"
              style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            {/* Icono y contador */}
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
                  onClick={handleAnterior}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
              )}

              <button
                onClick={handleSaltar}
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
