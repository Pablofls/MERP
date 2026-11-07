// Contenido de la ficha (estilo tienda de apps) de cada módulo. Las capturas viven en tienda/capturas/.

export interface FuncionModulo {
  titulo: string;
  descripcion: string;
}

export interface FichaModulo {
  subtitulo: string;
  color: string; // fondo del ícono
  enInicio: string; // qué aporta a Inicio
  acercaDe: string;
  funciones: FuncionModulo[];
  integraciones: string[];
}

export const FICHAS: Record<string, FichaModulo> = {
  escolar: {
    subtitulo: "Tu vida académica en un solo lugar",
    color: "#1e4976",
    enInicio: "Pendientes y clases",
    acercaDe:
      "Registra tus materias con su color, arma tu horario de clases y lleva el control de exámenes, quizzes y proyectos. Cada pendiente escolar queda ligado a su materia, así sabes qué te toca en cada clase y qué se viene esta semana.",
    funciones: [
      { titulo: "Materias con color", descripcion: "Cada materia tiene su color en el horario, los pendientes y el calendario de Inicio." },
      { titulo: "Horario semanal", descripcion: "Clases con días, hora, salón y periodo del semestre; vista de 3, 5 o 7 días." },
      { titulo: "Fechas importantes", descripcion: "Exámenes, quizzes y proyectos; una semana antes aparecen como pendientes." },
      { titulo: "Pendientes por materia", descripcion: "En lista o línea de tiempo, con filtros por materia y subtareas." },
    ],
    integraciones: [
      "Sus pendientes y fechas próximas aparecen en Inicio.",
      "Tus clases se muestran en la agenda y el calendario de Inicio.",
      "Las clases se crean como eventos recurrentes en Google Calendar.",
      "Los pendientes se sincronizan con Google Tasks.",
    ],
  },
  personal: {
    subtitulo: "Tus pendientes del día a día, a tu manera",
    color: "#4a3a6b",
    enInicio: "Pendientes",
    acercaDe:
      "Organiza todo lo que no es de la escuela: trámites, ejercicio, lectura, trabajo. Crea tus propias categorías con color y revisa tu semana de un vistazo.",
    funciones: [
      { titulo: "Categorías propias", descripcion: "Crea las que necesites (Fitness, Lectura, Trabajo…), cada una con su color." },
      { titulo: "Calendario semanal", descripcion: "Toca cualquier día para ver lo que tienes programado." },
      { titulo: "Lista o línea de tiempo", descripcion: "Ordena por fecha y filtra por categoría." },
      { titulo: "Subtareas", descripcion: "Divide un pendiente grande en pasos pequeños." },
    ],
    integraciones: [
      "Sus pendientes aparecen en Inicio junto con los escolares.",
      "Los pendientes se sincronizan con Google Tasks.",
    ],
  },
  habitos: {
    subtitulo: "Construye rutinas y mide tu constancia",
    color: "#1a5c3e",
    enInicio: "No, es independiente",
    acercaDe:
      "Da seguimiento a lo que quieres hacer seguido: leer, correr, tomar agua, ir al gimnasio. Registra cada día con un toque o con una cantidad, ponte metas semanales y mira tus rachas crecer.",
    funciones: [
      { titulo: "Sí/No o cantidad", descripcion: "Marca si lo hiciste o registra cuánto (km, páginas, vasos…)." },
      { titulo: "Diarios o semanales", descripcion: "Metas de veces por semana o de cantidad acumulada." },
      { titulo: "Rachas", descripcion: "Cuenta los días o semanas seguidas que cumples." },
      { titulo: "Calendario", descripcion: "Vista semanal o mensual con el color de cada hábito." },
    ],
    integraciones: ["Funciona por su cuenta: no agrega pendientes ni eventos a Inicio."],
  },
  closet: {
    subtitulo: "Tu ropa digitalizada y outfits en un toque",
    color: "#7a4b3a",
    enInicio: "No, es independiente",
    acercaDe:
      "Sube una foto de cada prenda y recorta su contorno tocando alrededor de ella, como con unas tijeras: la prenda queda sin fondo, lista para combinarse. Organiza tu closet en gorras, tops por capas, bottoms, calzado y accesorios, y deja que MERP te arme outfits al azar.",
    funciones: [
      { titulo: "Recorte a mano", descripcion: "Marca el contorno con toques; arrastra los puntos y usa la lupa para afinar." },
      { titulo: "Tops por capas", descripcion: "Camisas (capa 1), suéteres (capa 2) y chamarras (capa 3) se combinan con sentido." },
      { titulo: "Generar outfit", descripcion: "Un toque arma una combinación al azar con lo que tienes." },
      { titulo: "Fija lo que te gusta", descripcion: "Ponle candado a una prenda y genera el resto alrededor de ella." },
    ],
    integraciones: ["Funciona por su cuenta: no agrega pendientes ni eventos a Inicio."],
  },
};
