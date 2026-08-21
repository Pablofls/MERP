"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "./AuthContext";

interface TutorialContextType {
  activo: boolean;
  paso: number;
  totalPasos: number;
  iniciar: () => void;
  siguiente: () => void;
  anterior: () => void;
  terminar: () => void;
}

const TutorialContext = createContext<TutorialContextType>({
  activo: false,
  paso: 0,
  totalPasos: 0,
  iniciar: () => {},
  siguiente: () => {},
  anterior: () => {},
  terminar: () => {},
});

export const TOTAL_PASOS_TUTORIAL = 15;

function claveStorage(userId: string) {
  return `merp_tutorial_done_${userId}`;
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [activo, setActivo] = useState(false);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(claveStorage(user.id));
    if (!done) {
      const t = setTimeout(() => setActivo(true), 600);
      return () => clearTimeout(t);
    }
  }, [user]);

  const terminar = useCallback(() => {
    setActivo(false);
    setPaso(0);
    if (user) {
      localStorage.setItem(claveStorage(user.id), "1");
    }
  }, [user]);

  const iniciar = useCallback(() => {
    setPaso(0);
    setActivo(true);
  }, []);

  const siguiente = useCallback(() => {
    setPaso((p) => p + 1);
  }, []);

  const anterior = useCallback(() => {
    setPaso((p) => Math.max(0, p - 1));
  }, []);

  return (
    <TutorialContext.Provider
      value={{ activo, paso, totalPasos: TOTAL_PASOS_TUTORIAL, iniciar, siguiente, anterior, terminar }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  return useContext(TutorialContext);
}
