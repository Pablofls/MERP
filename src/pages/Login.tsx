import { useState, type FormEvent } from "react";
import { BookOpen, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

type Mode = "signin" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setError(translateError(error.message));
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) setError(translateError(error.message));
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cloud px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-grass shadow-press">
            <BookOpen className="h-11 w-11 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-ink">ReadMe</h1>
          <p className="mt-1 font-bold text-gray-500">
            Tu racha de lectura diaria 🔥
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2 rounded-2xl bg-line/60 p-1">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-extrabold transition-colors ${
                mode === m ? "bg-white text-ink shadow-card" : "text-gray-500"
              }`}
            >
              {m === "signin" ? "Entrar" : "Crear cuenta"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6">
          {/* Email */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-gray-600">
              Correo electrónico
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="input pl-11"
              />
            </div>
          </label>

          {/* Contraseña */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-gray-600">
              Contraseña
            </span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-grass w-full text-base"
            disabled={loading}
          >
            {loading
              ? "Un momento…"
              : mode === "signin"
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "Correo o contraseña incorrectos.";
  if (msg.includes("Email not confirmed"))
    return "Confirma tu correo antes de entrar (revisa tu bandeja).";
  if (msg.includes("User already registered"))
    return "Ya existe una cuenta con ese correo. Usa 'Entrar'.";
  if (msg.includes("Password should be at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("rate limit"))
    return "Demasiados intentos. Espera unos minutos.";
  return msg;
}
