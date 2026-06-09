import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Check, PartyPopper } from "lucide-react";
import { useBooks } from "../hooks/useBooks";
import { useAllSessions, useAddSession } from "../hooks/useSessions";
import { useProfile } from "../hooks/useProfile";
import { ReflectionForm } from "../components/ReflectionForm";
import { Spinner } from "../components/ui/Spinner";
import {
  currentPage,
  isAtEnd,
  pagesReadInSession,
  progressPercent,
  validateEndPage,
} from "../lib/pages";
import { todayInTimezone } from "../lib/streaks";
import { randomQuestion } from "../lib/reflectionQuestions";

export default function LogReading() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { data: books, isLoading: lb } = useBooks();
  const { data: sessions, isLoading: ls } = useAllSessions();
  const { data: profile } = useProfile();
  const addSession = useAddSession();

  const [selectedId, setSelectedId] = useState<string | undefined>(bookId);
  const [pageInput, setPageInput] = useState("");
  const [reflection, setReflection] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [savedReachedEnd, setSavedReachedEnd] = useState<string | null>(null);

  const today = todayInTimezone(profile?.timezone ?? "America/Mexico_City");
  // Una sola pregunta, elegida aleatoriamente al abrir la pantalla (estable durante la sesión).
  const [question] = useState(() => randomQuestion());

  const readingBooks = (books ?? []).filter((b) => b.status === "reading");
  const activeId = selectedId ?? readingBooks[0]?.id;
  const book = (books ?? []).find((b) => b.id === activeId);

  // Última página marcada del libro seleccionado.
  const previousPage = useMemo(() => {
    if (!book) return 0;
    const last = (sessions ?? []).find((s) => s.book_id === book.id);
    return currentPage(book, last?.end_page);
  }, [book, sessions]);

  if (lb || ls) return <Spinner label="Cargando…" />;

  // Estado: libro terminado tras guardar.
  if (savedReachedEnd && book) {
    return <FinishPrompt bookId={savedReachedEnd} bookTitle={book.title} />;
  }

  if (readingBooks.length === 0) {
    return (
      <div className="card mt-6 flex flex-col items-center gap-3 p-8 text-center">
        <BookOpen className="h-10 w-10 text-gray-300" />
        <p className="font-bold text-gray-500">
          No tienes libros en curso. Agrega uno o marca uno como "Leyendo".
        </p>
        <button className="btn-sky" onClick={() => navigate("/biblioteca")}>
          Ir a la biblioteca
        </button>
      </div>
    );
  }

  const newPage = parseInt(pageInput, 10);
  const validPage = Number.isInteger(newPage);
  const pagesRead = validPage ? pagesReadInSession(newPage, previousPage) : 0;
  const willFinish = validPage && book ? isAtEnd(book, newPage) : false;

  const handleSave = async () => {
    if (!book) return;
    const err = validateEndPage(book, newPage, previousPage);
    if (err) return setError(err);
    setError(null);

    try {
      await addSession.mutateAsync({
        book_id: book.id,
        session_date: today,
        end_page: newPage,
        pages_read: pagesRead,
        reflection,
      });

      if (isAtEnd(book, newPage)) {
        setSavedReachedEnd(book.id);
      } else {
        navigate("/");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  };

  return (
    <div className="flex flex-col gap-5 pt-2">
      <h1 className="text-2xl font-black text-ink">Registrar lectura</h1>

      {/* Selección de libro */}
      {readingBooks.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-extrabold text-gray-600">¿Qué libro?</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {readingBooks.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedId(b.id);
                  setPageInput("");
                  setError(null);
                }}
                className={`flex-shrink-0 rounded-2xl border-2 px-3 py-2 text-sm font-extrabold transition-colors ${
                  b.id === activeId
                    ? "border-grass bg-grass/10 text-grass-dark"
                    : "border-line bg-white text-gray-500"
                }`}
              >
                {b.title.length > 22 ? b.title.slice(0, 22) + "…" : b.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {book && (
        <>
          <section className="card p-5">
            <p className="font-extrabold text-ink">{book.title}</p>
            <p className="text-sm font-medium text-gray-400">
              Vas en la página{" "}
              <span className="font-bold text-ink">{previousPage}</span> de{" "}
              {book.end_page} · {progressPercent(book, previousPage)}%
            </p>

            <label className="mt-4 mb-1.5 block text-sm font-extrabold text-gray-600">
              ¿En qué página te quedaste hoy?
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder={`Mayor a ${previousPage}`}
              className="input text-lg"
              autoFocus
            />

            {validPage && pagesRead > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-grass/10 px-4 py-3">
                <span className="font-bold text-grass-dark">
                  Leíste {pagesRead} página{pagesRead === 1 ? "" : "s"} 🎉
                </span>
                <span className="text-sm font-bold text-grass-dark">
                  {progressPercent(book, newPage)}%
                </span>
              </div>
            )}
            {willFinish && (
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-flame">
                <PartyPopper className="h-4 w-4" /> ¡Llegarás al final del libro!
              </div>
            )}
          </section>

          {/* Reflexión */}
          <section className="card p-5">
            <h2 className="mb-1 text-lg font-extrabold text-ink">
              Reflexiona lo que leíste
            </h2>
            <p className="mb-4 text-sm font-medium text-gray-400">
              Responder esto mejora tu comprensión lectora.
            </p>
            <ReflectionForm
              questions={[question]}
              values={reflection}
              onChange={(id, value) =>
                setReflection((prev) => ({ ...prev, [id]: value }))
              }
            />
          </section>

          {error && (
            <p className="text-center text-sm font-bold text-red-500">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={addSession.isPending || !validPage}
            className="btn-grass w-full text-base"
          >
            <Check className="h-5 w-5" />
            {addSession.isPending ? "Guardando…" : "Guardar registro"}
          </button>
        </>
      )}
    </div>
  );
}

/** Tras alcanzar el final, ofrece terminar el libro. */
function FinishPrompt({
  bookId,
  bookTitle,
}: {
  bookId: string;
  bookTitle: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="card mt-8 flex flex-col items-center gap-4 p-8 text-center">
      <PartyPopper className="h-14 w-14 text-flame" />
      <h1 className="text-2xl font-black text-ink">¡Llegaste al final!</h1>
      <p className="font-bold text-gray-500">
        Terminaste de leer <span className="text-ink">{bookTitle}</span>.
        ¿Quieres calificarlo y guardarlo en tus terminados?
      </p>
      <button
        className="btn-grass w-full"
        onClick={() => navigate(`/libro/${bookId}?finish=1`)}
      >
        Calificar y terminar
      </button>
      <button className="btn-ghost w-full" onClick={() => navigate("/")}>
        Ahora no
      </button>
    </div>
  );
}
