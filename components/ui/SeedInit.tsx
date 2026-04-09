"use client";
import { useEffect } from "react";
import { seedIfEmpty } from "@/lib/seed";

export function SeedInit() {
  useEffect(() => { seedIfEmpty(); }, []);
  return null;
}
