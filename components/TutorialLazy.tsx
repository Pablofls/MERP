"use client";
import dynamic from "next/dynamic";
import { useTutorial } from "@/lib/context/TutorialContext";

const Tutorial = dynamic(() => import("@/components/Tutorial"), { ssr: false });

/** Descarga el tutorial (432 líneas) solo cuando se activa. */
export default function TutorialLazy() {
  const { activo } = useTutorial();
  return activo ? <Tutorial /> : null;
}
