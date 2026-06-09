/**
 * Preguntas de comprensión lectora (reflexión manual).
 * Enfocadas en recall y comprensión real, no en conexión personal.
 * Se muestra UNA pregunta aleatoria por sesión.
 */
export interface ReflectionQuestion {
  id: string;
  prompt: string;
  placeholder: string;
}

export const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "what_happened",
    prompt: "¿Qué pasó en lo que leíste? Describe los eventos principales.",
    placeholder: "Lo que sucedió en esta parte...",
  },
  {
    id: "key_people",
    prompt: "¿Quiénes fueron los personajes o personas clave en esta sección?",
    placeholder: "Nombres y su rol en esta parte...",
  },
  {
    id: "most_important",
    prompt: "¿Cuál fue el momento o hecho más importante de lo que leíste?",
    placeholder: "El punto central de esta sección...",
  },
  {
    id: "learned",
    prompt: "¿Qué aprendiste que no sabías antes de leer esto?",
    placeholder: "Un dato, idea o concepto nuevo...",
  },
  {
    id: "surprising",
    prompt: "¿Qué fue lo más sorprendente o inesperado que encontraste?",
    placeholder: "Algo que te sorprendió o no esperabas...",
  },
  {
    id: "cause_effect",
    prompt: "¿Qué decisión o acción clave ocurrió y qué consecuencias tuvo?",
    placeholder: "La causa y el efecto más claro de esta parte...",
  },
  {
    id: "key_facts",
    prompt: "¿Qué datos o hechos concretos recuerdas de lo que acabas de leer?",
    placeholder: "Fechas, números, nombres, lugares...",
  },
  {
    id: "situation_change",
    prompt: "¿Cómo cambió la situación respecto a lo que llevabas leído antes?",
    placeholder: "Qué era diferente al terminar esta sección...",
  },
  {
    id: "open_question",
    prompt: "¿Qué pregunta te quedó sin responder después de leer esto?",
    placeholder: "Algo que quieres saber o que quedó en el aire...",
  },
  {
    id: "main_idea",
    prompt: "Si tuvieras que explicarle a alguien en 2 frases lo que leíste, ¿qué dirías?",
    placeholder: "El resumen más corto posible...",
  },
];

/** Elige 1 pregunta aleatoria. Usar como initializer de useState para que sea estable por sesión. */
export function randomQuestion(): ReflectionQuestion {
  return REFLECTION_QUESTIONS[
    Math.floor(Math.random() * REFLECTION_QUESTIONS.length)
  ];
}
